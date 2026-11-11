// Full-resolution print file, reachable only through a signed, expiring link
// that the webhook hands to Prodigi.
import { get } from "@vercel/blob";
import { verifySig } from "../_lib/shop.js";

export default {
  async fetch(request) {
    const q = new URL(request.url).searchParams;
    const p = q.get("p") || "";
    const exp = Number(q.get("exp") || 0);
    if (!p.startsWith("masters/") || !exp || exp < Date.now() / 1000 || !verifySig(`${p}|${exp}`, q.get("sig"))) {
      return new Response("forbidden", { status: 403 });
    }
    const res = await get(p, { access: "private" });
    if (!res || res.statusCode !== 200) return new Response("not found", { status: 404 });
    return new Response(res.stream, {
      headers: {
        "content-type": res.blob.contentType || "image/jpeg",
        "content-length": String(res.blob.size),
        "cache-control": "private, no-store",
        "x-robots-tag": "noindex",
      },
    });
  },
};
