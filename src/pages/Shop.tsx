import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, CalendarDays } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { pageTransition } from "../utils/animation";

interface SizeOption {
  key: string;
  label: string;
  price: number;
  dpi?: number;
}
interface ShopItem {
  id: string;
  title: string;
  medium: string;
  description: string;
  preview: string;
  w: number;
  h: number;
  options: Record<string, SizeOption[]>;
}
interface CalendarInfo {
  title: string;
  preview?: string;
  months: { slot: string; id: string; preview?: string }[];
  sizes: SizeOption[];
}
interface Catalog {
  enabled: boolean;
  items: ShopItem[];
  calendar: CalendarInfo | null;
  types: Record<string, { label: string; blurb: string; colors: string[] | null }>;
  countries: [string, string][];
}
interface CartLine {
  kind: "print" | "calendar";
  id?: string;
  type?: string;
  size: string;
  color?: string;
  qty: number;
  // display only; the server re-prices everything
  title: string;
  detail: string;
  price: number;
  preview?: string;
}

const money = (cents: number) =>
  `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

const CART_KEY = "smp-shop-cart";
const loadCart = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveCart = (c: CartLine[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable */
  }
};

const ProductPanel: React.FC<{
  item: ShopItem;
  types: Catalog["types"];
  onAdd: (l: CartLine) => void;
  onClose: () => void;
}> = ({ item, types, onAdd, onClose }) => {
  const typeKeys = Object.keys(item.options);
  const [type, setType] = useState(typeKeys[0]);
  const sizes = item.options[type] || [];
  const [size, setSize] = useState(sizes[0]?.key);
  const colors = types[type]?.colors;
  const [color, setColor] = useState(colors?.[0] || "");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setSize((item.options[type] || [])[0]?.key);
    setColor(types[type]?.colors?.[0] || "");
  }, [type, item, types]);

  const chosen = sizes.find((s) => s.key === size);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white w-full md:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-xl grid md:grid-cols-2"
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-purple-50 flex items-center justify-center p-4">
          <img src={item.preview} alt={item.title} className="max-h-[45vh] md:max-h-[70vh] object-contain rounded-lg shadow" />
        </div>
        <div className="p-5 font-josefin space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
              <p className="text-sm text-purple-500">{item.medium}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {typeKeys.map((k) => (
              <button
                key={k}
                onClick={() => setType(k)}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  type === k
                    ? "bg-gradient-to-r from-purple-400 to-pink-400 text-white"
                    : "bg-purple-50 text-gray-600 hover:bg-purple-100"
                }`}
              >
                {types[k]?.label || k}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">{types[type]?.blurb}</p>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Size</p>
            <div className="grid grid-cols-2 gap-2">
              {sizes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSize(s.key)}
                  className={`border rounded-lg px-3 py-2 text-left text-sm ${
                    size === s.key ? "border-pink-400 bg-pink-50" : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <span className="block text-gray-800">{s.label}</span>
                  <span className="block text-purple-500">{money(s.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {colors && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Frame</p>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`px-3 py-1.5 rounded-full text-sm capitalize border ${
                      color === c ? "border-pink-400 bg-pink-50" : "border-gray-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button className="p-1.5 rounded-full bg-purple-50" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Fewer">
              <Minus size={16} />
            </button>
            <span className="w-6 text-center">{qty}</span>
            <button className="p-1.5 rounded-full bg-purple-50" onClick={() => setQty(Math.min(5, qty + 1))} aria-label="More">
              <Plus size={16} />
            </button>
          </div>

          <button
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              onAdd({
                kind: "print",
                id: item.id,
                type,
                size: chosen.key,
                color: colors ? color : undefined,
                qty,
                title: item.title,
                detail: `${types[type]?.label}, ${chosen.label}${colors ? `, ${color} frame` : ""}`,
                price: chosen.price,
                preview: item.preview,
              });
            }}
            className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-50"
          >
            Add to cart{chosen ? ` · ${money(chosen.price * qty)}` : ""}
          </button>
          <p className="text-xs text-gray-400">
            Printed to order by a professional lab and shipped directly to you, usually within 3–7 business days plus shipping time.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Shop: React.FC = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [country, setCountry] = useState("US");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [calSize, setCalSize] = useState<string>("");
  const [params, setParams] = useSearchParams();
  const orderState = params.get("order");

  useEffect(() => {
    fetch("/api/shop/catalog")
      .then((r) => r.json())
      .then((c: Catalog) => {
        setCatalog(c);
        if (c.calendar?.sizes[0]) setCalSize(c.calendar.sizes[0].key);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (orderState === "success") {
      setCart([]);
      saveCart([]);
    }
  }, [orderState]);

  const updateCart = (c: CartLine[]) => {
    setCart(c);
    saveCart(c);
  };

  const addLine = (l: CartLine) => {
    const same = cart.findIndex(
      (c) => c.kind === l.kind && c.id === l.id && c.type === l.type && c.size === l.size && c.color === l.color
    );
    const next = [...cart];
    if (same >= 0) next[same] = { ...next[same], qty: Math.min(5, next[same].qty + l.qty) };
    else next.push(l);
    updateCart(next.slice(0, 10));
    setSelected(null);
    setCartOpen(true);
  };

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const checkout = async () => {
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          country,
          cart: cart.map(({ kind, id, type, size, color, qty }) => ({ kind, id, type, size, color, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setCheckoutError((e as Error).message);
      setCheckingOut(false);
    }
  };

  const open = catalog?.enabled && (catalog.items.length > 0 || catalog.calendar);
  const cal = catalog?.calendar;
  const calChosen = cal?.sizes.find((s) => s.key === calSize);

  return (
    <motion.div {...pageTransition} className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Prints
        </h2>
        {open && (
          <button
            onClick={() => setCartOpen(true)}
            className="font-josefin relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-purple-600"
          >
            <ShoppingBag size={18} />
            Cart
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        )}
      </div>

      {orderState && (
        <div
          className={`font-josefin rounded-xl p-4 flex justify-between items-start gap-3 ${
            orderState === "success" ? "bg-green-50 text-green-800" : "bg-purple-50 text-gray-700"
          }`}
        >
          <p>
            {orderState === "success"
              ? "Thank you, your order is in. A receipt is on its way to your email, and your prints go to the lab now. Expect them in about 1–2 weeks."
              : "Checkout was cancelled. Your cart is still here."}
          </p>
          <button onClick={() => setParams({})} aria-label="Dismiss">
            <X size={18} />
          </button>
        </div>
      )}

      {!catalog && !loadError && <p className="font-josefin text-gray-500">Loading…</p>}
      {(loadError || (catalog && !open)) && (
        <p className="font-josefin text-gray-600 bg-white/80 rounded-xl p-4">
          Prints are coming soon. In the meantime, get in touch through the contact page if you'd like one.
        </p>
      )}

      {open && cal && (
        <div className="bg-white/90 rounded-2xl shadow-sm overflow-hidden grid md:grid-cols-2">
          <div className="grid grid-cols-4 gap-1 p-2 bg-purple-50">
            {cal.months.slice(1, 13).map((m) => (
              <img key={m.slot} src={m.preview} alt={m.slot} className="aspect-[4/3] object-cover rounded" loading="lazy" />
            ))}
          </div>
          <div className="p-5 font-josefin space-y-3">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarDays size={20} className="text-pink-500" /> {cal.title}
            </h3>
            <p className="text-sm text-gray-500">
              Twelve months of film photographs, wire-bound on heavy silk paper, January–December 2027.
            </p>
            <div className="flex flex-wrap gap-2">
              {cal.sizes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setCalSize(s.key)}
                  className={`border rounded-lg px-3 py-2 text-sm text-left ${
                    calSize === s.key ? "border-pink-400 bg-pink-50" : "border-gray-200"
                  }`}
                >
                  <span className="block">{s.label}</span>
                  <span className="block text-purple-500">{money(s.price)}</span>
                </button>
              ))}
            </div>
            <button
              disabled={!calChosen}
              onClick={() =>
                calChosen &&
                addLine({
                  kind: "calendar",
                  size: calChosen.key,
                  qty: 1,
                  title: cal.title,
                  detail: calChosen.label,
                  price: calChosen.price,
                  preview: cal.preview,
                })
              }
              className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold"
            >
              Add calendar to cart
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {catalog!.items.map((item) => {
            const from = Math.min(...Object.values(item.options).flat().map((s) => s.price));
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group text-left rounded-xl overflow-hidden bg-white/90 shadow-sm"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.preview}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 font-josefin">
                  <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                  <p className="text-xs text-purple-500">From {money(from)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {createPortal(<AnimatePresence>
        {selected && catalog && (
          <ProductPanel item={selected} types={catalog.types} onAdd={addLine} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>, document.body)}

      {createPortal(<AnimatePresence>
        {cartOpen && catalog && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          >
            <motion.aside
              className="bg-white w-full max-w-md h-full overflow-y-auto p-5 font-josefin flex flex-col"
              initial={{ x: 60 }}
              animate={{ x: 0 }}
              exit={{ x: 60 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Cart</h3>
                <button onClick={() => setCartOpen(false)} aria-label="Close cart">
                  <X size={22} />
                </button>
              </div>
              {cart.length === 0 ? (
                <p className="text-gray-500">Your cart is empty.</p>
              ) : (
                <div className="space-y-3 flex-1">
                  {cart.map((l, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      {l.preview && <img src={l.preview} alt="" className="w-16 h-16 object-cover rounded" />}
                      <div className="flex-1 text-sm">
                        <p className="font-semibold text-gray-800">{l.title}</p>
                        <p className="text-gray-500">{l.detail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateCart(cart.map((c, j) => (j === i ? { ...c, qty: Math.max(1, c.qty - 1) } : c)))} aria-label="Fewer">
                            <Minus size={14} />
                          </button>
                          <span>{l.qty}</span>
                          <button onClick={() => updateCart(cart.map((c, j) => (j === i ? { ...c, qty: Math.min(5, c.qty + 1) } : c)))} aria-label="More">
                            <Plus size={14} />
                          </button>
                          <button className="ml-3 text-xs text-gray-400 underline" onClick={() => updateCart(cart.filter((_, j) => j !== i))}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <span className="text-sm">{money(l.price * l.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
              {cart.length > 0 && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <label className="block text-sm text-gray-600">
                    Ship to
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2 bg-white"
                    >
                      {catalog.countries.map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-xs text-gray-400">Shipping is added at checkout. Prices in USD.</p>
                  {checkoutError && <p className="text-sm text-red-600">{checkoutError}</p>}
                  <button
                    onClick={checkout}
                    disabled={checkingOut}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-60"
                  >
                    {checkingOut ? "Opening checkout…" : "Checkout"}
                  </button>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </motion.div>
  );
};

export default Shop;
