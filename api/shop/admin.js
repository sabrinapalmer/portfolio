// Admin actions for /shop/admin. Every call needs the x-admin-password header.
import { del } from "@vercel/blob";
import {
  buildCatalog, isAdmin, json, listAll, mapCalendarAreas, prodigi, readJson, shopConfigured, siteUrl, writeJson,
} from "../_lib/shop.js";
import { submitOrder } from "../_lib/submit.js";
import {
  CALENDARS, CALENDAR_SLOTS, ID_RE, PRODUCT_TYPES, RATIOS, SHIPPING, priceFor, skuFor,
} from "../../shop/catalog.js";

function allSkus() {
  const skus = new Map();
  for (const [typeKey, t] of Object.entries(PRODUCT_TYPES)) {
    for (const ratio of Object.keys(RATIOS)) {
      for (const size of t.sizes[ratio] || []) {
        skus.set(skuFor(typeKey, size), { type: typeKey, size: size.label, price: priceFor(typeKey, size), shipClass: t.shipClass(size), colors: t.colors });
      }
    }
  }
  for (const c of Object.values(CALENDARS)) skus.set(c.sku, { type: "calendar", size: c.label, price: c.price, shipClass: "small" });
  return skus;
}

async function checkSkus() {
  const rows = [];
  const missing = [];
  for (const [sku, info] of allSkus()) {
    const det = await prodigi(`/v4.0/products/${encodeURIComponent(sku)}`);
    if (!det.ok) {
      missing.push(sku);
      rows.push({ sku, ...info, exists: false, note: `Prodigi ${det.status}` });
      continue;
    }
    const product = det.data.product || {};
    const attrs = product.attributes || {};
    const attributes = {};
    if (info.type === "canvas") attributes.wrap = "MirrorWrap";
    if (info.colors) attributes.color = info.colors[0];
    const printAreas = Object.keys(product.printAreas || {});
    const assets = printAreas.length ? printAreas.map((p) => ({ printArea: p })) : [{ printArea: "default" }];
    const q = await prodigi("/v4.0/quotes", {
      method: "POST",
      body: { shippingMethod: "standard", destinationCountryCode: "US", currencyCode: "USD", items: [{ sku, copies: 1, attributes, assets }] },
    });
    const quote = q.data?.quotes?.[0];
    const itemCost = Number(quote?.costSummary?.items?.amount || NaN);
    const shipCost = Number(quote?.costSummary?.shipping?.amount || NaN);
    const shipCharged = SHIPPING.US[info.shipClass] / 100;
    rows.push({
      sku, ...info, exists: true, attributes: attrs, printAreas,
      calendarMapping: info.type === "calendar" ? mapCalendarAreas(printAreas) : undefined,
      costItem: itemCost, costShipping: shipCost,
      margin: Number.isFinite(itemCost) ? +(info.price / 100 + shipCharged - itemCost - (shipCost || 0)).toFixed(2) : null,
      note: q.ok ? "" : `Quote failed: ${JSON.stringify(q.data).slice(0, 300)}`,
    });
  }
  const result = { checkedAt: new Date().toISOString(), env: process.env.PRODIGI_ENV === "live" ? "live" : "sandbox", missing, rows };
  await writeJson("config/sku-check.json", result);
  return result;
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "POST only" }, 405);
    if (!process.env.SHOP_ADMIN_PASSWORD) return json({ error: "Set SHOP_ADMIN_PASSWORD in Vercel first" }, 503);
    if (!isAdmin(request)) return json({ error: "Wrong password" }, 401);
    const body = await request.json().catch(() => ({}));
    try {
      switch (body.action) {
        case "status": {
          const { artworks, masters, calendarConfig, items, calendar } = await buildCatalog();
          return json({
            config: shopConfigured(), prodigiEnv: process.env.PRODIGI_ENV === "live" ? "live" : "sandbox",
            artworks, masters, calendarConfig, calendarSlots: CALENDAR_SLOTS,
            liveItems: items.map((i) => ({ id: i.id, options: i.options })), calendarLive: !!calendar,
            skuCheck: await readJson("config/sku-check.json"),
          });
        }
        case "saveArtwork": {
          const a = body.artwork || {};
          if (!ID_RE.test(a.id || "")) return json({ error: "Id must be lowercase letters, numbers and dashes" }, 400);
          const rec = {
            id: a.id, title: String(a.title || "").slice(0, 120) || a.id,
            medium: String(a.medium || "Painting").slice(0, 60),
            description: String(a.description || "").slice(0, 600),
            w: Number(a.w) || 1600, h: Number(a.h) || 1200,
          };
          await writeJson(`products/${rec.id}.json`, rec);
          return json({ ok: true });
        }
        case "setHidden": {
          const hidden = new Set((await readJson("config/hidden.json")) || []);
          if (body.hidden) hidden.add(body.id); else hidden.delete(body.id);
          await writeJson("config/hidden.json", [...hidden]);
          return json({ ok: true });
        }
        case "deleteArtwork": {
          if (!ID_RE.test(body.id || "")) return json({ error: "Bad id" }, 400);
          const blobs = [
            ...(await listAll(`products/${body.id}.json`)),
            ...(await listAll(`previews/${body.id}/`)),
            ...(await listAll(`masters/${body.id}/`)),
          ];
          if (blobs.length) await del(blobs.map((b) => b.url));
          return json({ ok: true, removed: blobs.length });
        }
        case "saveCalendar": {
          const slots = {};
          for (const s of CALENDAR_SLOTS) {
            const id = body.slots?.[s];
            if (id && ID_RE.test(id)) slots[s] = id;
          }
          await writeJson("config/calendar.json", { title: String(body.title || "2027 Wall Calendar").slice(0, 80), slots });
          return json({ ok: true });
        }
        case "checkSkus":
          return json(await checkSkus());
        case "orders": {
          const blobs = (await listAll("orders/")).sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, 50);
          const orders = await Promise.all(blobs.map((b) => readJson(b.pathname)));
          return json({ orders: orders.filter(Boolean).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) });
        }
        case "retryOrder": {
          if (!/^cs_[A-Za-z0-9_]+$/.test(body.sessionId || "")) return json({ error: "Bad session id" }, 400);
          return json(await submitOrder(body.sessionId, siteUrl(request), { force: !!body.force }));
        }
        default:
          return json({ error: "Unknown action" }, 400);
      }
    } catch (e) {
      console.error("admin", e);
      return json({ error: e.message }, 500);
    }
  },
};
