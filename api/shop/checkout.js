// Creates a Stripe Checkout session from the cart. Prices come from the
// server-side catalog only; the browser sends ids and sizes, never amounts.
import Stripe from "stripe";
import { buildCatalog, json, shopConfigured, siteUrl } from "../_lib/shop.js";
import { resolveCart } from "../_lib/fulfill.js";
import { COUNTRIES, CURRENCY, shippingFor } from "../../shop/catalog.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") return json({ error: "POST only" }, 405);
    const cfg = shopConfigured();
    if (!cfg.ok) return json({ error: "The shop is not open yet." }, 503);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
    const country = String(body.country || "");
    if (!COUNTRIES.some(([c]) => c === country)) return json({ error: "We don't ship there yet" }, 400);

    let lines;
    try {
      lines = resolveCart(body.cart, await buildCatalog());
    } catch (e) {
      return json({ error: e.message }, 400);
    }

    const base = siteUrl(request);
    const ship = shippingFor(country, lines.map((l) => l.shipClass));
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const abs = (u) => (u?.startsWith("http") ? u : `${base}${u}`);
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lines.map((l) => ({
          quantity: l.qty,
          price_data: {
            currency: CURRENCY,
            unit_amount: l.price,
            product_data: { name: l.name, images: l.image ? [abs(l.image)] : undefined, metadata: l.meta },
          },
        })),
        shipping_address_collection: { allowed_countries: [country] },
        shipping_options: [{
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: ship.label,
            fixed_amount: { amount: ship.amount, currency: CURRENCY },
          },
        }],
        phone_number_collection: { enabled: true },
        metadata: { source: "sabrinapalmer.com shop" },
        payment_intent_data: { description: "SMP Photography print order" },
        success_url: `${base}/shop?order=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/shop?order=cancelled`,
      });
      return json({ url: session.url });
    } catch (e) {
      console.error("checkout", e);
      return json({ error: "Could not start checkout. Please try again." }, 502);
    }
  },
};
