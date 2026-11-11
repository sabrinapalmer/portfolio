// Web preview images for artworks added on /shop/admin (stored privately).
import { get } from "@vercel/blob";
import { ID_RE } from "../../shop/catalog.js";
import { listAll } from "../_lib/shop.js";

export default {
  async fetch(request) {
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!ID_RE.test(id)) return new Response("bad id", { status: 400 });
    const blobs = await listAll(`previews/${id}/`);
    if (!blobs.length) return new Response("not found", { status: 404 });
    blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
    const res = await get(blobs[0].pathname, { access: "private" });
    if (!res || res.statusCode !== 200) return new Response("not found", { status: 404 });
    return new Response(res.stream, {
      headers: {
        "content-type": res.blob.contentType || "image/jpeg",
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  },
};
