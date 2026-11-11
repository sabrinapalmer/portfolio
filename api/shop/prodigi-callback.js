// Prodigi status callbacks (in production, shipped, tracking).
import { json, readJson, verifySig, writeJson } from "../_lib/shop.js";

export default {
  async fetch(request) {
    const q = new URL(request.url).searchParams;
    const o = q.get("o") || "";
    if (!/^cs_[A-Za-z0-9_]+$/.test(o) || !verifySig(o, q.get("sig"))) return json({ error: "forbidden" }, 403);
    const body = await request.json().catch(() => ({}));
    const order = body?.data?.order || body?.order || {};
    const path = `orders/${o}.json`;
    const rec = (await readJson(path)) || { sessionId: o };
    const tracking = (order.shipments || []).map((s) => s.tracking).filter(Boolean);
    await writeJson(path, {
      ...rec,
      updatedAt: new Date().toISOString(),
      prodigiOrderId: order.id || rec.prodigiOrderId,
      prodigiStage: order.status?.stage || rec.prodigiStage,
      lastEvent: body.type || null,
      tracking: tracking.length ? tracking : rec.tracking,
    });
    return json({ ok: true });
  },
};
