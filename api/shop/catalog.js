import { buildCatalog, json, shopConfigured } from "../_lib/shop.js";
import { COUNTRIES, PRODUCT_TYPES } from "../../shop/catalog.js";

export default {
  async fetch() {
    const cfg = shopConfigured();
    if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ enabled: false, items: [], calendar: null });
    try {
      const { items, calendar } = await buildCatalog();
      const types = Object.fromEntries(
        Object.entries(PRODUCT_TYPES).map(([k, t]) => [k, { label: t.label, blurb: t.blurb, colors: t.colors || null }]),
      );
      return json(
        { enabled: cfg.ok, items, calendar, types, countries: COUNTRIES },
        200,
        { "cache-control": "public, s-maxage=60, stale-while-revalidate=600" },
      );
    } catch (e) {
      console.error("catalog", e);
      return json({ enabled: false, items: [], calendar: null, error: "catalog unavailable" }, 500);
    }
  },
};
