import React, { useCallback, useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

// Private admin for the print shop: upload print files, add artworks,
// set up the calendar, check Prodigi SKUs/costs, and see orders.

interface Master { pathname: string; w: number; h: number; size: number; ts: number }
interface Artwork { id: string; title: string; medium: string; preview: string; w: number; h: number; hidden?: boolean; description?: string }
interface Status {
  config: { ok: boolean; missing: string[] };
  prodigiEnv: string;
  artworks: Artwork[];
  masters: Record<string, Master>;
  calendarConfig: { title?: string; slots?: Record<string, string> } | null;
  calendarSlots: string[];
  liveItems: { id: string; options: Record<string, { label: string; dpi: number }[]> }[];
  calendarLive: boolean;
  skuCheck: SkuCheck | null;
}
interface SkuRow {
  sku: string; type: string; size: string; price: number; exists: boolean; note?: string;
  costItem?: number; costShipping?: number; margin?: number | null;
  attributes?: Record<string, string[]>; printAreas?: string[]; calendarMapping?: Record<string, string> | null;
}
interface SkuCheck { checkedAt: string; env: string; missing: string[]; rows: SkuRow[] }
interface Order {
  sessionId: string; createdAt: string; status: string; error?: string; amountTotal?: number;
  customer?: { name?: string; email?: string }; items?: { name: string; qty: number }[];
  prodigiOrderId?: string; prodigiStage?: string; tracking?: { number?: string; url?: string }[];
}

const PW_KEY = "smp-shop-admin";
const getPw = () => { try { return sessionStorage.getItem(PW_KEY) || ""; } catch { return ""; } };
const setPwStore = (v: string) => { try { sessionStorage.setItem(PW_KEY, v); } catch { /* ignore */ } };

async function imageSize(file: File): Promise<{ w: number; h: number; bitmap: ImageBitmap }> {
  const bitmap = await createImageBitmap(file);
  return { w: bitmap.width, h: bitmap.height, bitmap };
}
async function makePreview(bitmap: ImageBitmap): Promise<Blob> {
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("preview failed"))), "image/jpeg", 0.85));
}
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 50);

const box = "bg-white/95 rounded-2xl shadow-sm p-5 space-y-3";
const btn = "px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm disabled:opacity-50";
const btn2 = "px-3 py-1.5 rounded-full bg-purple-50 text-gray-700 text-sm hover:bg-purple-100 disabled:opacity-50";

const ShopAdmin: React.FC = () => {
  const [pw, setPw] = useState(getPw);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [newArt, setNewArt] = useState({ title: "", medium: "Painting", description: "" });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [cal, setCal] = useState<Record<string, string>>({});
  const [calTitle, setCalTitle] = useState("2027 Wall Calendar");

  const call = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch("/api/shop/admin", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }, [pw]);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const s: Status = await call("status");
      setStatus(s);
      setCal(s.calendarConfig?.slots || {});
      if (s.calendarConfig?.title) setCalTitle(s.calendarConfig.title);
      setPwStore(pw);
    } catch (e) {
      setError((e as Error).message);
      setStatus(null);
    }
  }, [call, pw]);

  useEffect(() => { if (pw) refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError("");
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(""); }
  };

  const uploadMaster = (id: string, file: File) =>
    run(`Uploading print file for ${id}`, async () => {
      if (!/jpe?g|png/i.test(file.type)) throw new Error("Use a JPEG or PNG file");
      const { w, h } = await imageSize(file);
      const ext = file.type.includes("png") ? "png" : "jpg";
      await upload(`masters/${id}/${Date.now()}-${w}x${h}.${ext}`, file, {
        access: "private", handleUploadUrl: "/api/shop/upload", clientPayload: JSON.stringify({ pw }), multipart: file.size > 20e6,
      });
      await refresh();
    });

  const addArtwork = () =>
    run("Adding artwork", async () => {
      if (!newFile || !newArt.title) throw new Error("Title and file are required");
      const id = slug(newArt.title);
      if (id.length < 2) throw new Error("Pick a longer title");
      const { w, h, bitmap } = await imageSize(newFile);
      const preview = await makePreview(bitmap);
      const opts = { access: "private" as const, handleUploadUrl: "/api/shop/upload", clientPayload: JSON.stringify({ pw }) };
      await upload(`previews/${id}/${Date.now()}.jpg`, preview, opts);
      await call("saveArtwork", { artwork: { id, ...newArt, w, h } });
      const ext = newFile.type.includes("png") ? "png" : "jpg";
      await upload(`masters/${id}/${Date.now()}-${w}x${h}.${ext}`, newFile, { ...opts, multipart: newFile.size > 20e6 });
      setNewArt({ title: "", medium: "Painting", description: "" });
      setNewFile(null);
      await refresh();
    });

  if (!status) {
    return (
      <div className="max-w-md mx-auto font-josefin space-y-3 pt-6">
        <h2 className="text-2xl font-bold text-gray-800">Shop admin</h2>
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Admin password"
          className="w-full border rounded-lg px-3 py-2" onKeyDown={(e) => e.key === "Enter" && refresh()}
        />
        <button className={btn} onClick={refresh}>Open</button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  const live = new Map(status.liveItems.map((i) => [i.id, i]));
  const withMaster = status.artworks.filter((a) => status.masters[a.id]);

  return (
    <div className="font-josefin space-y-6 pb-16 text-gray-800">
      <h2 className="text-2xl font-bold">Shop admin</h2>
      {busy && <p className="text-purple-600 text-sm">{busy}…</p>}
      {error && <p className="text-red-600 text-sm whitespace-pre-wrap">{error}</p>}

      <section className={box}>
        <h3 className="font-semibold">Setup</h3>
        {status.config.ok ? (
          <p className="text-sm text-green-700">All keys present. Prodigi mode: <b>{status.prodigiEnv}</b>{status.prodigiEnv !== "live" && " — orders go to the sandbox and are not printed. Set PRODIGI_ENV=live to go live."}</p>
        ) : (
          <p className="text-sm text-red-700">Missing in Vercel environment variables: {status.config.missing.join(", ")}. The storefront stays closed until these are set.</p>
        )}
        <p className="text-sm text-gray-500">{status.liveItems.length} artworks for sale. Calendar {status.calendarLive ? "for sale" : "not for sale yet"}.</p>
      </section>

      <section className={box}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Prodigi SKUs and costs</h3>
          <button className={btn2} disabled={!!busy} onClick={() => run("Checking SKUs with Prodigi (about a minute)", async () => { await call("checkSkus"); await refresh(); })}>
            Check SKUs & costs
          </button>
        </div>
        {status.skuCheck ? (
          <div className="overflow-x-auto">
            <p className="text-xs text-gray-500 mb-2">Checked {new Date(status.skuCheck.checkedAt).toLocaleString()} ({status.skuCheck.env}). Margin = price + shipping charged − Prodigi item − Prodigi shipping, to a US address, before Stripe fees (~3%). SKUs that don't exist are hidden from the store automatically.</p>
            <table className="text-xs w-full">
              <thead><tr className="text-left text-gray-500"><th className="pr-2">SKU</th><th className="pr-2">Price</th><th className="pr-2">Cost</th><th className="pr-2">Ship cost</th><th className="pr-2">Margin</th><th>Notes</th></tr></thead>
              <tbody>
                {status.skuCheck.rows.map((r) => (
                  <tr key={r.sku} className={r.exists ? "" : "text-red-600"}>
                    <td className="pr-2 py-0.5">{r.sku}</td>
                    <td className="pr-2">${(r.price / 100).toFixed(0)}</td>
                    <td className="pr-2">{r.costItem != null && Number.isFinite(r.costItem) ? `$${r.costItem.toFixed(2)}` : "—"}</td>
                    <td className="pr-2">{r.costShipping != null && Number.isFinite(r.costShipping) ? `$${r.costShipping.toFixed(2)}` : "—"}</td>
                    <td className={`pr-2 ${r.margin != null && r.margin < 10 ? "text-red-600" : ""}`}>{r.margin != null ? `$${r.margin}` : "—"}</td>
                    <td className="text-gray-500">
                      {r.exists ? "" : "not found "}
                      {r.note}
                      {r.attributes && Object.keys(r.attributes).length > 0 && ` attrs: ${Object.entries(r.attributes).map(([k, v]) => `${k}=${(v || []).join("/")}`).join("; ")}`}
                      {r.type === "calendar" && r.exists && (r.calendarMapping ? " pages mapped" : ` PAGE NAMES NOT RECOGNISED: ${(r.printAreas || []).join(", ")}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Not checked yet. Run this once the Prodigi key is set.</p>
        )}
      </section>

      <section className={box}>
        <h3 className="font-semibold">Artworks and print files</h3>
        <p className="text-sm text-gray-500">An artwork goes on sale once its full-resolution file is uploaded. Sizes are offered only where the file has at least 150 dpi (100 for canvas). Files stay private; only the lab gets a time-limited link.</p>
        <div className="divide-y">
          {status.artworks.map((a) => {
            const m = status.masters[a.id];
            const li = live.get(a.id);
            return (
              <div key={a.id} className="py-3 flex flex-wrap gap-3 items-center">
                <img src={a.preview} alt="" className="w-16 h-16 object-cover rounded" />
                <div className="flex-1 min-w-[10rem] text-sm">
                  <p className="font-semibold truncate">{a.title} {a.hidden && <span className="text-xs text-gray-400">(hidden)</span>}</p>
                  {m ? (
                    <p className="text-gray-500">
                      File {m.w}×{m.h}px · {li ? Object.entries(li.options).map(([t, s]) => `${t}: ${s.map((x) => x.label.replace(" in", "")).join(", ")}`).join(" · ") : "too small for any size"}
                    </p>
                  ) : (
                    <p className="text-amber-600">No print file yet</p>
                  )}
                </div>
                <label className={`${btn2} cursor-pointer`}>
                  {m ? "Replace file" : "Upload file"}
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMaster(a.id, e.target.files[0])} />
                </label>
                <button className={btn2} onClick={() => run("Saving", async () => { await call("setHidden", { id: a.id, hidden: !a.hidden }); await refresh(); })}>
                  {a.hidden ? "Show" : "Hide"}
                </button>
                {a.preview.startsWith("/api/") && (
                  <button className={btn2} onClick={() => confirm(`Delete ${a.title} and its files?`) && run("Deleting", async () => { await call("deleteArtwork", { id: a.id }); await refresh(); })}>
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={box}>
        <h3 className="font-semibold">Add an artwork (paintings, new photos)</h3>
        <p className="text-sm text-gray-500">For paintings, a flat, evenly lit scan or photo at full resolution prints best. A preview for the shop is made automatically.</p>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Title" value={newArt.title} onChange={(e) => setNewArt({ ...newArt, title: e.target.value })} />
        <select className="w-full border rounded-lg px-3 py-2 bg-white" value={newArt.medium} onChange={(e) => setNewArt({ ...newArt, medium: e.target.value })}>
          {["Painting", "Film Photography", "Digital Photography"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Description (optional)" value={newArt.description} onChange={(e) => setNewArt({ ...newArt, description: e.target.value })} />
        <input type="file" accept="image/jpeg,image/png" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
        <button className={btn} disabled={!!busy} onClick={addArtwork}>Add artwork</button>
      </section>

      <section className={box}>
        <h3 className="font-semibold">2027 calendar</h3>
        <p className="text-sm text-gray-500">Pick a front cover, one image per month and a back cover from artworks that have print files. Landscape images fit the page best. The calendar goes on sale when all 14 are set.</p>
        <input className="w-full border rounded-lg px-3 py-2" value={calTitle} onChange={(e) => setCalTitle(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {status.calendarSlots.map((s) => (
            <label key={s} className="text-sm flex items-center gap-2">
              <span className="w-24 capitalize">{s}</span>
              <select className="flex-1 border rounded-lg px-2 py-1 bg-white" value={cal[s] || ""} onChange={(e) => setCal({ ...cal, [s]: e.target.value })}>
                <option value="">—</option>
                {withMaster.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </label>
          ))}
        </div>
        <button className={btn} disabled={!!busy} onClick={() => run("Saving calendar", async () => { await call("saveCalendar", { slots: cal, title: calTitle }); await refresh(); })}>
          Save calendar
        </button>
      </section>

      <section className={box}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Orders</h3>
          <button className={btn2} onClick={() => run("Loading orders", async () => setOrders((await call("orders")).orders))}>Load orders</button>
        </div>
        {orders && orders.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
        {orders?.map((o) => (
          <div key={o.sessionId} className="text-sm border rounded-lg p-3 space-y-1">
            <p className="flex justify-between gap-2">
              <span>{new Date(o.createdAt).toLocaleString()} · {o.customer?.name} ({o.customer?.email})</span>
              <span className={o.status === "submitted" ? "text-green-700" : "text-red-600"}>{o.status}{o.prodigiStage ? ` · ${o.prodigiStage}` : ""}</span>
            </p>
            <p className="text-gray-600">{o.items?.map((i) => `${i.qty}× ${i.name}`).join("; ")} · ${((o.amountTotal || 0) / 100).toFixed(2)}</p>
            {o.tracking?.map((t, i) => t.url && <a key={i} href={t.url} className="text-purple-600 underline" target="_blank" rel="noreferrer">Tracking {t.number}</a>)}
            {o.error && <p className="text-red-600 break-words">{o.error}</p>}
            {o.status !== "submitted" && (
              <button className={btn2} onClick={() => run("Resending to Prodigi", async () => { await call("retryOrder", { sessionId: o.sessionId }); setOrders((await call("orders")).orders); })}>
                Send to Prodigi again
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default ShopAdmin;
