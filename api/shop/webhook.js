// Stripe webhook: a paid checkout becomes a Prodigi order automatically.
import Stripe from "stripe";
import { json, siteUrl } from "../_lib/shop.js";
import { submitOrder } from "../_lib/submit.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "POST only" }, 405);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        await request.text(), request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (e) {
      return json({ error: `Signature check failed: ${e.message}` }, 400);
    }
    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
      return json({ ignored: event.type });
    }
    try {
      const result = await submitOrder(event.data.object.id, siteUrl(request));
      console.log("order", event.data.object.id, result.status, result.error || "");
      // 500 makes Stripe retry later (safe: Prodigi dedupes on idempotencyKey).
      return json(result, result.retryable ? 500 : 200);
    } catch (e) {
      console.error("webhook", e);
      return json({ error: e.message }, 500);
    }
  },
};
