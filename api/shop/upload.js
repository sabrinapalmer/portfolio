// Direct-from-browser uploads into the private store (print masters,
// previews). Admin password travels in the client payload.
import { handleUpload } from "@vercel/blob/client";
import { createHmac, timingSafeEqual } from "node:crypto";
import { json } from "../_lib/shop.js";

const ALLOWED = /^(masters\/[a-z0-9-]+\/\d+-\d+x\d+\.(jpe?g|png|tiff?)|previews\/[a-z0-9-]+\/\d+\.jpg)$/i;

function passwordOk(pw) {
  const want = process.env.SHOP_ADMIN_PASSWORD || "";
  if (want.length < 8) return false;
  const h = (s) => createHmac("sha256", "cmp").update(s).digest();
  return timingSafeEqual(h(want), h(String(pw || "")));
}

export default {
  async fetch(request) {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "Bad request" }, 400);
    try {
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          let pw = "";
          try { pw = JSON.parse(clientPayload || "{}").pw; } catch { /* ignore */ }
          if (!passwordOk(pw)) throw new Error("Wrong admin password");
          if (!ALLOWED.test(pathname)) throw new Error("Bad file path");
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/tiff"],
            maximumSizeInBytes: 200 * 1024 * 1024,
            addRandomSuffix: false,
            allowOverwrite: false,
          };
        },
        onUploadCompleted: async () => {},
      });
      return json(result);
    } catch (e) {
      return json({ error: e.message }, 400);
    }
  },
};
