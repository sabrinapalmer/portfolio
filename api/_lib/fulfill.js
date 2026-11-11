import { MAX_LINES, MAX_QTY, PRODUCT_TYPES } from "../../shop/catalog.js";

export function resolveCart(cart, catalog) {
  if (!Array.isArray(cart) || !cart.length) throw new Error("Cart is empty");
  if (cart.length > MAX_LINES) throw new Error(`At most ${MAX_LINES} different items per order`);
  const lines = [];
  for (const c of cart) {
    const qty = Math.trunc(Number(c.qty));
    if (!(qty >= 1 && qty <= MAX_QTY)) throw new Error("Invalid quantity");
    if (c.kind === "calendar") {
      const size = catalog.calendar?.sizes.find((s) => s.key === c.size);
      if (!size) throw new Error("That calendar is not available");
      lines.push({
        qty, price: size.price, name: `${catalog.calendar.title} (${size.label})`,
        image: catalog.calendar.preview, shipClass: "small",
        meta: { kind: "calendar", size: size.key, sku: size.sku },
      });
      continue;
    }
    const item = catalog.items.find((i) => i.id === c.id);
    const sizes = item?.options[c.type];
    const size = sizes?.find((s) => s.key === c.size);
    if (!size) throw new Error("One of the items is no longer available in that size");
    const type = PRODUCT_TYPES[c.type];
    let color = "";
    if (type.colors) {
      color = type.colors.includes(c.color) ? c.color : type.colors[0];
    }
    lines.push({
      qty,
      price: size.price,
      name: `${item.title} — ${type.label}, ${size.label}${color ? `, ${color} frame` : ""}`,
      image: item.preview,
      shipClass: type.shipClass(size),
      meta: { kind: "print", id: item.id, type: c.type, size: size.key, sku: size.sku, color },
    });
  }
  return lines;
}

// Stripe Checkout session + its line items -> Prodigi order body.
// `assetUrl(pathname)` returns a signed URL for a master file.
// `calendarAreas` maps Prodigi print-area name -> slot (from mapCalendarAreas).
export function buildProdigiOrder({ session, lineItems, masters, calendarSlots, calendarAreas, assetUrl, callbackUrl }) {
  const ship = session.collected_information?.shipping_details || session.shipping_details;
  const cust = session.customer_details || {};
  if (!ship?.address) throw new Error("No shipping address on the session");
  const a = ship.address;
  const items = [];
  for (const li of lineItems) {
    const m = li.price?.product?.metadata || {};
    const copies = li.quantity || 1;
    if (m.kind === "calendar") {
      if (!calendarAreas) throw new Error("Calendar print areas could not be mapped");
      const assets = Object.entries(calendarAreas).map(([printArea, slot]) => {
        const master = masters[calendarSlots?.[slot]];
        if (!master) throw new Error(`Calendar image missing for ${slot}`);
        return { printArea, url: assetUrl(master.pathname) };
      });
      items.push({ merchantReference: `${session.id}:${items.length}`, sku: m.sku, copies, sizing: "fillPrintArea", assets });
    } else if (m.kind === "print") {
      const master = masters[m.id];
      if (!master) throw new Error(`Print file missing for ${m.id}`);
      const attributes = {};
      if (m.type === "canvas") attributes.wrap = "MirrorWrap";
      if (m.type === "framed" && m.color) attributes.color = m.color;
      items.push({
        merchantReference: `${session.id}:${items.length}`,
        sku: m.sku, copies, sizing: "fillPrintArea", attributes,
        recipientCost: { amount: ((li.price.unit_amount || 0) / 100).toFixed(2), currency: (li.currency || "usd").toUpperCase() },
        assets: [{ printArea: "default", url: assetUrl(master.pathname) }],
      });
    }
  }
  if (!items.length) throw new Error("No printable items in this order");
  return {
    merchantReference: session.id.slice(-40),
    idempotencyKey: session.id,
    shippingMethod: "Standard",
    callbackUrl,
    recipient: {
      name: ship.name || cust.name || "Customer",
      email: cust.email || undefined,
      phoneNumber: cust.phone || undefined,
      address: {
        line1: a.line1, line2: a.line2 || undefined, postalOrZipCode: a.postal_code,
        countryCode: a.country, townOrCity: a.city, stateOrCounty: a.state || undefined,
      },
    },
    items,
    metadata: { stripeSession: session.id },
  };
}
