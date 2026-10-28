// Print shop catalog: product types, sizes, Prodigi SKUs, prices and shipping.
// Shared by the API functions (server is the source of truth for prices) and
// the shop page (display only).
//
// Prices are in USD cents. Run "Check SKUs & costs" on /shop/admin after the
// Prodigi key is set: it confirms every SKU exists, lists its real attributes,
// and shows Prodigi's cost next to each price so margins can be checked.

export const CURRENCY = "usd";

// Aspect families. Each artwork is matched to the family closest to its own
// ratio; the lab fills the print area, so the crop is at most a few percent.
export const RATIOS = {
  "3:2": 1.5,
  "4:3": 4 / 3,
  "5:4": 1.25,
};

// Size definitions: short x long edge in inches.
const S = (short, long) => ({ key: `${short}x${long}`, short, long, label: `${short} × ${long} in` });

export const PRODUCT_TYPES = {
  paper: {
    label: "Fine art print",
    blurb: "Giclée on 200gsm enhanced matte art paper, archival pigment inks. Ships unframed, rolled or flat.",
    skuPrefix: "GLOBAL-FAP",
    minDpi: 150,
    sizes: {
      "3:2": [S(8, 12), S(12, 18), S(16, 24), S(20, 30)],
      "4:3": [S(12, 16), S(18, 24)],
      "5:4": [S(8, 10), S(11, 14), S(16, 20)],
    },
    price: { 96: 4500, 154: 7500, 192: 7500, 216: 7500, 320: 12000, 384: 12000, 432: 12000, 600: 17500, 80: 4500 },
    shipClass: (size) => (size.long > 18 ? "large" : "small"),
    attributes: {},
  },
  canvas: {
    label: "Canvas",
    blurb: "Stretched canvas on a wooden frame, mirrored edges, ready to hang.",
    skuPrefix: "GLOBAL-CAN",
    minDpi: 100,
    sizes: {
      "3:2": [S(12, 18), S(16, 24), S(20, 30)],
      "4:3": [S(12, 16), S(18, 24)],
      "5:4": [S(11, 14), S(16, 20)],
    },
    price: { 154: 15000, 192: 15000, 216: 15000, 320: 21000, 384: 21000, 432: 21000, 600: 29000 },
    shipClass: () => "wall",
    attributes: { wrap: "MirrorWrap" },
  },
  framed: {
    label: "Framed print",
    blurb: "Fine art print in a classic wood frame with a white mount, glazed, ready to hang.",
    skuPrefix: "GLOBAL-CFPM",
    minDpi: 150,
    sizes: {
      "3:2": [S(8, 12), S(12, 18), S(16, 24)],
      "4:3": [S(12, 16), S(18, 24)],
      "5:4": [S(8, 10), S(11, 14), S(16, 20)],
    },
    price: { 80: 13000, 96: 13000, 154: 18000, 192: 18000, 216: 18000, 320: 26000, 384: 26000, 432: 26000 },
    shipClass: () => "wall",
    colors: ["black", "white", "natural"],
    attributes: {},
  },
};

// Price lookup is keyed by print area in square inches.
export function priceFor(typeKey, size) {
  const t = PRODUCT_TYPES[typeKey];
  return t && t.price[size.short * size.long];
}

export function skuFor(typeKey, size) {
  return `${PRODUCT_TYPES[typeKey].skuPrefix}-${size.short}X${size.long}`;
}

export function nearestRatio(width, height) {
  const r = Math.max(width, height) / Math.min(width, height);
  let best = "3:2";
  for (const [k, v] of Object.entries(RATIOS)) {
    if (Math.abs(v - r) < Math.abs(RATIOS[best] - r)) best = k;
  }
  return best;
}

// Sizes a master file can print at, given its pixel dimensions.
export function sizesFor(typeKey, width, height) {
  const t = PRODUCT_TYPES[typeKey];
  const ratio = nearestRatio(width, height);
  const longPx = Math.max(width, height);
  const shortPx = Math.min(width, height);
  return t.sizes[ratio]
    .map((size) => {
      const dpi = Math.floor(Math.min(longPx / size.long, shortPx / size.short));
      return { ...size, dpi, sku: skuFor(typeKey, size), price: priceFor(typeKey, size) };
    })
    .filter((s) => s.dpi >= t.minDpi && s.price);
}

// 2027 dated wall calendar. Prodigi prints the date grids; we supply 14 images
// (front cover, 12 months, back cover).
export const CALENDARS = {
  a4: { sku: "CALENDAR-A4-L-DATED", label: "2027 wall calendar, A4 (11.7 × 8.3 in)", price: 3500, minLongPx: 2400 },
  a5: { sku: "CALENDAR-A5-L-DATED", label: "2027 wall calendar, A5 (8.3 × 5.8 in)", price: 2500, minLongPx: 1800 },
};
export const CALENDAR_SLOTS = [
  "front", "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december", "back",
];

// Flat shipping per order, by the bulkiest item. USD cents.
export const SHIPPING = {
  US: { small: 800, large: 1400, wall: 2500, label: "Standard shipping (US)" },
  NEAR: { small: 1800, large: 2800, wall: 4500, label: "Standard international shipping" },
};
export const COUNTRIES = [
  ["US", "United States"], ["MX", "Mexico"], ["CA", "Canada"], ["GB", "United Kingdom"],
  ["IE", "Ireland"], ["FR", "France"], ["DE", "Germany"], ["ES", "Spain"], ["IT", "Italy"],
  ["NL", "Netherlands"], ["BE", "Belgium"], ["AT", "Austria"], ["PT", "Portugal"],
  ["SE", "Sweden"], ["DK", "Denmark"], ["FI", "Finland"], ["AU", "Australia"], ["NZ", "New Zealand"],
];
export function shippingFor(country, classes) {
  const table = country === "US" ? SHIPPING.US : SHIPPING.NEAR;
  const rank = { small: 0, large: 1, wall: 2 };
  const worst = classes.reduce((a, c) => (rank[c] > rank[a] ? c : a), "small");
  return { amount: table[worst], label: table.label };
}

export const MAX_QTY = 5;
export const MAX_LINES = 10;

// Artworks already on the site. Previews are the gallery images; the print
// master (full resolution) is uploaded separately on /shop/admin and never
// shipped to the browser.
export const SEED_ARTWORKS = [
  { id: "sticks-at-sunset", title: "Sticks at Sunset, Moonrise", medium: "Film Photography", preview: "/shop/previews/film_sunsetsticks.jpeg", w: 1061, h: 1600 },
  { id: "rock-building", title: "Rock Building", medium: "Film Photography", preview: "/shop/previews/film_rockbuilding.jpg", w: 1600, h: 1061 },
  { id: "camel-rock", title: "Camel Rock Formation", medium: "Film Photography", preview: "/shop/previews/film_camelrock.jpg", w: 1600, h: 1061 },
  { id: "calf-and-mother", title: "Calf and Mother", medium: "Film Photography", preview: "/shop/previews/film_calfandmom.jpg", w: 1600, h: 1061 },
  { id: "smile-tower", title: "Smile Tower", medium: "Film Photography", preview: "/shop/previews/film_smiletower.jpg", w: 1061, h: 1600 },
  { id: "film-burn-fire-station", title: "Film Burn at Fire Station", medium: "Film Photography", preview: "/shop/previews/film_fire.jpg", w: 1600, h: 1061 },
  { id: "moire-pattern", title: "Moiré Pattern", medium: "Film Photography", preview: "/shop/previews/film_moirepattern.jpg", w: 1600, h: 1061 },
  { id: "bahai-in-the-fog", title: "Baháʼí in the Fog", medium: "Film Photography", preview: "/shop/previews/film_bhai.jpg", w: 1600, h: 1061 },
  { id: "building-on-film", title: "Building on Film", medium: "Film Photography", preview: "/shop/previews/film_building.jpeg", w: 1600, h: 1059 },
  { id: "landscape-1", title: "Landscape I", medium: "Film Photography", preview: "/shop/previews/film_landscape1.jpg", w: 1061, h: 1600 },
  { id: "landscape-2", title: "Landscape II", medium: "Film Photography", preview: "/shop/previews/film_landscape2.jpeg", w: 1600, h: 977 },
  { id: "landscape-3", title: "Landscape III", medium: "Film Photography", preview: "/shop/previews/film_landscape3.jpeg", w: 1600, h: 1098 },
  { id: "landscape-4", title: "Landscape IV", medium: "Film Photography", preview: "/shop/previews/film_landscape4.jpeg", w: 1600, h: 1061 },
  { id: "flowers-on-film", title: "Flowers on Film", medium: "Film Photography", preview: "/shop/previews/film_flowers.jpg", w: 1600, h: 1061 },
  { id: "griffith-observatory", title: "Griffith Observatory on Film", medium: "Film Photography", preview: "/shop/previews/film_griffith.jpeg", w: 1600, h: 1264 },
];

export const ID_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;
