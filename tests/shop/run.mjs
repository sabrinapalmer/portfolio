// Unit tests for the print shop logic. Run: node tests/shop/run.mjs
import assert from "node:assert/strict";
process.env.SHOP_SIGNING_SECRET = "test-secret";
const cat = await import("../../shop/catalog.js");
const { resolveCart, buildProdigiOrder } = await import("../../api/_lib/fulfill.js");
const { mapCalendarAreas, sign, verifySig, signedMasterUrl } = await import("../../api/_lib/shop.js");

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok", name); };

t("every configured size has a price", () => {
  for (const [k, type] of Object.entries(cat.PRODUCT_TYPES))
    for (const sizes of Object.values(type.sizes))
      for (const s of sizes) assert.ok(cat.priceFor(k, s) > 0, `${k} ${s.key}`);
});

t("ratio matching", () => {
  assert.equal(cat.nearestRatio(3089, 2048), "3:2");
  assert.equal(cat.nearestRatio(3024, 4032), "4:3");
  assert.equal(cat.nearestRatio(4000, 5000), "5:4");
});

t("sizes respect minimum dpi (typical lab film scan 3089x2048)", () => {
  const paper = cat.sizesFor("paper", 3089, 2048).map((s) => s.key);
  assert.deepEqual(paper, ["8x12", "12x18"]); // 16x24 would be 128dpi
  const canvas = cat.sizesFor("canvas", 3089, 2048).map((s) => s.key);
  assert.deepEqual(canvas, ["12x18", "16x24", "20x30"].filter((k) => k !== "20x30" || 2048 / 20 >= 100));
  assert.equal(cat.sizesFor("paper", 1600, 1061).length, 0); // web previews never sell
  assert.equal(cat.skuFor("framed", { short: 11, long: 14 }), "GLOBAL-CFPM-11X14");
});

t("shipping takes the bulkiest class", () => {
  assert.equal(cat.shippingFor("US", ["small", "wall"]).amount, cat.SHIPPING.US.wall);
  assert.equal(cat.shippingFor("MX", ["small"]).amount, cat.SHIPPING.NEAR.small);
});

const catalog = {
  items: [{ id: "camel-rock", title: "Camel Rock", preview: "/p.jpg", options: { paper: cat.sizesFor("paper", 3089, 2048), framed: cat.sizesFor("framed", 3089, 2048) } }],
  calendar: { title: "2027 Wall Calendar", preview: "/c.jpg", sizes: [{ key: "a4", label: "A4", price: 3500, sku: "CALENDAR-A4-L-DATED" }] },
};

t("cart is priced from the server catalog, not the client", () => {
  const lines = resolveCart([{ kind: "print", id: "camel-rock", type: "paper", size: "12x18", qty: 2, price: 1 }], catalog);
  assert.equal(lines[0].price, 7500);
  assert.equal(lines[0].meta.sku, "GLOBAL-FAP-12X18");
  const framed = resolveCart([{ kind: "print", id: "camel-rock", type: "framed", size: "8x12", color: "pink", qty: 1 }], catalog);
  assert.equal(framed[0].meta.color, "black"); // unknown colour falls back
  const c = resolveCart([{ kind: "calendar", size: "a4", qty: 1 }], catalog);
  assert.equal(c[0].meta.sku, "CALENDAR-A4-L-DATED");
});

t("cart rejects bad input", () => {
  assert.throws(() => resolveCart([], catalog));
  assert.throws(() => resolveCart([{ kind: "print", id: "camel-rock", type: "paper", size: "16x24", qty: 1 }], catalog));
  assert.throws(() => resolveCart([{ kind: "print", id: "nope", type: "paper", size: "8x12", qty: 1 }], catalog));
  assert.throws(() => resolveCart([{ kind: "print", id: "camel-rock", type: "paper", size: "8x12", qty: 99 }], catalog));
});

t("signatures", () => {
  assert.ok(verifySig("a|1", sign("a|1")));
  assert.ok(!verifySig("a|2", sign("a|1")));
  assert.ok(!verifySig("a|1", undefined));
  const u = new URL(signedMasterUrl("https://x.com", "masters/a/1-10x10.jpg"));
  assert.ok(verifySig(`${u.searchParams.get("p")}|${u.searchParams.get("exp")}`, u.searchParams.get("sig")));
});

t("calendar print-area mapping", () => {
  const names = ["front_cover", ...["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].map((m) => `${m}`), "back_cover"];
  const map = mapCalendarAreas(names);
  assert.equal(map.back_cover, "back");
  assert.equal(map.front_cover, "front");
  assert.equal(map.sep, "september");
  const numeric = mapCalendarAreas(["cover", ...Array.from({ length: 12 }, (_, i) => `month${i + 1}`), "back"]);
  assert.equal(numeric.month12, "december");
  assert.equal(mapCalendarAreas(["default"]), null);
});

t("Prodigi order body from a Stripe session", () => {
  const session = {
    id: "cs_test_123",
    collected_information: { shipping_details: { name: "Ana Ruiz", address: { line1: "1 Calle", line2: null, city: "Ensenada", state: "BC", postal_code: "22800", country: "MX" } } },
    customer_details: { email: "a@x.com", phone: "+52 646 000 0000", name: "Ana" },
  };
  const lineItems = [
    { quantity: 2, currency: "usd", price: { unit_amount: 7500, product: { metadata: { kind: "print", id: "camel-rock", type: "framed", size: "12x18", sku: "GLOBAL-CFPM-12X18", color: "white" } } } },
    { quantity: 1, currency: "usd", price: { unit_amount: 3500, product: { metadata: { kind: "calendar", size: "a4", sku: "CALENDAR-A4-L-DATED" } } } },
  ];
  const masters = { "camel-rock": { pathname: "masters/camel-rock/1-3089x2048.jpg" }, m: { pathname: "masters/m/1-3000x2000.jpg" } };
  const slots = Object.fromEntries(cat.CALENDAR_SLOTS.map((s) => [s, "m"]));
  const areas = Object.fromEntries(cat.CALENDAR_SLOTS.map((s) => [`area_${s}`, s]));
  const body = buildProdigiOrder({ session, lineItems, masters, calendarSlots: slots, calendarAreas: areas, assetUrl: (p) => `https://x/${p}`, callbackUrl: "https://x/cb" });
  assert.equal(body.idempotencyKey, "cs_test_123");
  assert.equal(body.recipient.address.countryCode, "MX");
  assert.equal(body.recipient.address.townOrCity, "Ensenada");
  assert.equal(body.items[0].copies, 2);
  assert.deepEqual(body.items[0].attributes, { color: "white" });
  assert.equal(body.items[0].assets[0].url, "https://x/masters/camel-rock/1-3089x2048.jpg");
  assert.equal(body.items[1].assets.length, 14);
  assert.throws(() => buildProdigiOrder({ session, lineItems: [lineItems[0]], masters: {}, assetUrl: (p) => p }));
});

console.log(`\n${n} passed`);
