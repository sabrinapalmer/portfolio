// Turns a paid Stripe session into a Prodigi order and records it.
import Stripe from "stripe";
import {
  latestMasters, mapCalendarAreas, prodigi, readJson, sign, signedMasterUrl, writeJson,
} from "./shop.js";
import { buildProdigiOrder } from "./fulfill.js";

export async function submitOrder(sessionId, base, { force = false } = {}) {
  const path = `orders/${sessionId}.json`;
  const existing = await readJson(path);
  if (existing?.status === "submitted" && !force) return { status: "submitted", order: existing };

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { status: "unpaid" };
  const lineItems = [];
  for await (const li of stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ["data.price.product"] })) {
    lineItems.push(li);
  }

  const masters = await latestMasters();
  let calendarSlots = null;
  let calendarAreas = null;
  const cal = lineItems.find((li) => li.price?.product?.metadata?.kind === "calendar");
  if (cal) {
    calendarSlots = (await readJson("config/calendar.json"))?.slots;
    const details = await prodigi(`/v4.0/products/${encodeURIComponent(cal.price.product.metadata.sku)}`);
    calendarAreas = mapCalendarAreas(Object.keys(details.data?.product?.printAreas || {}));
  }

  const record = {
    sessionId,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    amountTotal: session.amount_total,
    currency: session.currency,
    customer: { name: session.customer_details?.name, email: session.customer_details?.email },
    items: lineItems.map((li) => ({ name: li.description, qty: li.quantity, sku: li.price?.product?.metadata?.sku })),
    attempts: (existing?.attempts || 0) + 1,
  };

  let body;
  try {
    body = buildProdigiOrder({
      session, lineItems, masters, calendarSlots, calendarAreas,
      assetUrl: (p) => signedMasterUrl(base, p),
      callbackUrl: `${base}/api/shop/prodigi-callback?o=${sessionId}&sig=${sign(sessionId)}`,
    });
  } catch (e) {
    await writeJson(path, { ...record, status: "failed", error: e.message });
    return { status: "failed", error: e.message, retryable: false };
  }

  const res = await prodigi("/v4.0/orders", { method: "POST", body });
  const outcome = res.data?.outcome;
  if (res.ok && outcome && outcome !== "createdWithIssues" && outcome !== "onHold") {
    await writeJson(path, { ...record, status: "submitted", prodigiOrderId: res.data.order?.id, prodigiOutcome: outcome, prodigiStage: res.data.order?.status?.stage });
    return { status: "submitted" };
  }
  const error = res.ok ? `Prodigi accepted the order with outcome "${outcome}" — check it in the Prodigi dashboard` : `Prodigi ${res.status}: ${JSON.stringify(res.data).slice(0, 800)}`;
  await writeJson(path, { ...record, status: res.ok ? "needs-attention" : "failed", prodigiOrderId: res.data?.order?.id, error });
  return { status: res.ok ? "needs-attention" : "failed", error, retryable: !res.ok && res.status >= 500 };
}
