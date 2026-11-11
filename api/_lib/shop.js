// Server-side helpers for the print shop. Files under api/_lib are not routes.
import { createHmac, timingSafeEqual } from "node:crypto";
import { get, list, put } from "@vercel/blob";
import {
  SEED_ARTWORKS, PRODUCT_TYPES, CALENDARS, CALENDAR_SLOTS, sizesFor, ID_RE,
} from "../../shop/catalog.js";

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

export function siteUrl(request) {
  if (process.env.SHOP_SITE_URL) return process.env.SHOP_SITE_URL.replace(/\/$/, "");
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}

// ---------- signing ----------
function secret() {
  const s = process.env.SHOP_SIGNING_SECRET;
  if (!s) throw new Error("SHOP_SIGNING_SECRET is not set");
  return s;
}
export const sign = (value) => createHmac("sha256", secret()).update(value).digest("base64url");
export function verifySig(value, sig) {
  if (!sig) return false;
  const a = Buffer.from(sign(value));
  const b = Buffer.from(String(sig));
  return a.length === b.length && timingSafeEqual(a, b);
}
export function isAdmin(request) {
  const want = process.env.SHOP_ADMIN_PASSWORD;
  const got = request.headers.get("x-admin-password") || "";
  if (!want || want.length < 8) return false;
  const a = Buffer.from(createHmac("sha256", "cmp").update(want).digest());
  const b = Buffer.from(createHmac("sha256", "cmp").update(got).digest());
  return timingSafeEqual(a, b);
}

// ---------- blob storage (private store) ----------
export async function readJson(pathname) {
  const res = await get(pathname, { access: "private", useCache: false }).catch(() => null);
  if (!res || res.statusCode !== 200) return null;
  return JSON.parse(await new Response(res.stream).text());
}
export const writeJson = (pathname, data) =>
  put(pathname, JSON.stringify(data, null, 2), {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
  });

export async function listAll(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

// masters/<id>/<timestamp>-<w>x<h>.<ext>  (newest wins)
const MASTER_RE = /^masters\/([a-z0-9-]+)\/(\d+)-(\d+)x(\d+)\.(jpe?g|png|tiff?)$/i;
export async function latestMasters() {
  const masters = {};
  for (const b of await listAll("masters/")) {
    const m = b.pathname.match(MASTER_RE);
    if (!m) continue;
    const [, id, ts, w, h] = m;
    if (!masters[id] || Number(ts) > masters[id].ts) {
      masters[id] = { pathname: b.pathname, ts: Number(ts), w: Number(w), h: Number(h), size: b.size };
    }
  }
  return masters;
}

// Artworks = the seeded gallery photos + anything added on /shop/admin.
export async function allArtworks() {
  const records = await Promise.all((await listAll("products/")).map((b) => readJson(b.pathname)));
  const added = records
    .filter((p) => p && ID_RE.test(p.id))
    .map((p) => ({ ...p, preview: `/api/shop/img?id=${p.id}` }));
  const hidden = new Set(((await readJson("config/hidden.json")) || []).filter(Boolean));
  const byId = new Map(SEED_ARTWORKS.map((a) => [a.id, a]));
  for (const a of added) byId.set(a.id, a);
  return [...byId.values()].map((a) => ({ ...a, hidden: hidden.has(a.id) }));
}

// Everything the storefront can sell right now, with server-side prices.
export async function buildCatalog() {
  const [artworks, masters, skuCheck, calendar] = await Promise.all([
    allArtworks(), latestMasters(), readJson("config/sku-check.json"), readJson("config/calendar.json"),
  ]);
  const badSkus = new Set(skuCheck?.missing || []);
  const items = [];
  for (const a of artworks) {
    const m = masters[a.id];
    if (!m || a.hidden) continue;
    const options = {};
    for (const typeKey of Object.keys(PRODUCT_TYPES)) {
      const sizes = sizesFor(typeKey, m.w, m.h).filter((s) => !badSkus.has(s.sku));
      if (sizes.length) options[typeKey] = sizes;
    }
    if (Object.keys(options).length) {
      items.push({ id: a.id, title: a.title, medium: a.medium, description: a.description || "", preview: a.preview, w: a.w, h: a.h, options });
    }
  }
  let cal = null;
  if (calendar?.slots) {
    const ok = CALENDAR_SLOTS.every((s) => masters[calendar.slots[s]]);
    if (ok) {
      const longest = Math.min(...CALENDAR_SLOTS.map((s) => Math.max(masters[calendar.slots[s]].w, masters[calendar.slots[s]].h)));
      const sizes = Object.entries(CALENDARS)
        .filter(([, c]) => longest >= c.minLongPx && !badSkus.has(c.sku))
        .map(([key, c]) => ({ key, label: c.label, price: c.price, sku: c.sku }));
      const cover = artworks.find((a) => a.id === calendar.slots.front);
      if (sizes.length) {
        cal = {
          title: calendar.title || "2027 Wall Calendar",
          preview: cover?.preview,
          months: CALENDAR_SLOTS.map((s) => ({ slot: s, id: calendar.slots[s], preview: artworks.find((a) => a.id === calendar.slots[s])?.preview })),
          sizes,
        };
      }
    }
  }
  return { items, calendar: cal, artworks, masters, calendarConfig: calendar };
}

export function shopConfigured() {
  const missing = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "PRODIGI_API_KEY", "SHOP_SIGNING_SECRET", "BLOB_READ_WRITE_TOKEN"]
    .filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

// ---------- Prodigi ----------
export function prodigiBase() {
  return process.env.PRODIGI_ENV === "live" ? "https://api.prodigi.com" : "https://api.sandbox.prodigi.com";
}
export async function prodigi(path, { method = "GET", body } = {}) {
  const res = await fetch(`${prodigiBase()}${path}`, {
    method,
    headers: { "X-API-Key": process.env.PRODIGI_API_KEY || "", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 2000) }; }
  return { ok: res.ok, status: res.status, data };
}

export function signedMasterUrl(base, pathname, days = 30) {
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  return `${base}/api/shop/master?p=${encodeURIComponent(pathname)}&exp=${exp}&sig=${sign(`${pathname}|${exp}`)}`;
}

// Map Prodigi's calendar print-area names onto our 14 slots.
export function mapCalendarAreas(areaNames) {
  const months = CALENDAR_SLOTS.slice(1, 13);
  const map = {};
  for (const name of areaNames) {
    const n = name.toLowerCase();
    if (/back/.test(n)) map[name] = "back";
    else if (/front|cover/.test(n)) map[name] = "front";
    else {
      const byName = months.find((m) => n.includes(m) || n.includes(m.slice(0, 3)));
      const num = n.match(/(\d{1,2})/);
      if (byName) map[name] = byName;
      else if (num && Number(num[1]) >= 1 && Number(num[1]) <= 12) map[name] = months[Number(num[1]) - 1];
    }
  }
  const covered = new Set(Object.values(map));
  return covered.size === CALENDAR_SLOTS.length ? map : null;
}
