import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const INK = "#2B1840";
const sw = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type ShapeName = "star" | "heart" | "sparkle" | "moon" | "cloud" | "rainbow";

const Shape: React.FC<{ name: ShapeName; color: string; className?: string }> = ({
  name,
  color,
  className,
}) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden>
    {name === "star" && (
      <path {...sw} fill={color} d="M24 4l6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 19l14-2z" />
    )}
    {name === "heart" && (
      <path {...sw} fill={color} d="M24 41S6 30 6 17c0-6 5-10 10-10 4 0 7 2 8 6 1-4 4-6 8-6 5 0 10 4 10 10 0 13-18 24-18 24z" />
    )}
    {name === "sparkle" && (
      <path {...sw} fill={color} d="M24 4c2 13 7 18 20 20-13 2-18 7-20 20-2-13-7-18-20-20 13-2 18-7 20-20z" />
    )}
    {name === "moon" && (
      <path {...sw} fill={color} d="M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6z" />
    )}
    {name === "cloud" && (
      <path {...sw} fill={color} d="M14 36h22a8 8 0 0 0 0-16 11 11 0 0 0-21-2 9 9 0 0 0-1 18z" />
    )}
    {name === "rainbow" && (
      <g fill="none" strokeLinecap="round">
        <path d="M6 38a18 18 0 0 1 36 0" stroke={INK} strokeWidth="11" />
        <path d="M6 38a18 18 0 0 1 36 0" stroke="#FF5FA8" strokeWidth="7" />
        <path d="M12 38a12 12 0 0 1 24 0" stroke={INK} strokeWidth="9" />
        <path d="M12 38a12 12 0 0 1 24 0" stroke="#FFD43B" strokeWidth="5" />
        <path d="M17 38a7 7 0 0 1 14 0" stroke="#4DB8FF" strokeWidth="4" />
      </g>
    )}
  </svg>
);

/* Positions keep to the page edges so doodles sit beside content, not on it. */
const floaters: {
  name: ShapeName;
  color: string;
  pos: React.CSSProperties;
  size: string;
  anim: string;
}[] = [
  { name: "star", color: "#FFD43B", pos: { left: "2%", top: "14%" }, size: "h-9 w-9", anim: "animate-drift-1" },
  { name: "heart", color: "#FF5FA8", pos: { right: "2.5%", top: "22%" }, size: "h-8 w-8", anim: "animate-drift-2" },
  { name: "cloud", color: "#FFFFFF", pos: { left: "4%", top: "46%" }, size: "h-12 w-12", anim: "animate-drift-3" },
  { name: "sparkle", color: "#4DB8FF", pos: { right: "4%", top: "52%" }, size: "h-8 w-8", anim: "animate-drift-1" },
  { name: "moon", color: "#C9B6FF", pos: { left: "1.5%", top: "76%" }, size: "h-9 w-9", anim: "animate-drift-2" },
  { name: "rainbow", color: "", pos: { right: "2%", top: "80%" }, size: "h-12 w-12", anim: "animate-drift-3" },
  { name: "heart", color: "#2FD0A0", pos: { left: "6%", top: "92%" }, size: "h-7 w-7", anim: "animate-drift-1" },
  { name: "star", color: "#FF9A3C", pos: { right: "7%", top: "8%" }, size: "h-7 w-7", anim: "animate-drift-2" },
];

export const FloatingDoodles: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
    {floaters.map((f, i) => (
      <div
        key={i}
        className={`absolute opacity-55 ${f.anim} hidden xl:block`}
        style={{ ...f.pos, animationDelay: `${-i * 2.3}s` }}
      >
        <Shape name={f.name} color={f.color} className={f.size} />
      </div>
    ))}
  </div>
);

/* ---------- click sparkles ---------- */

const burstShapes: ShapeName[] = ["star", "heart", "sparkle"];
const burstColors = ["#FF5FA8", "#FFD43B", "#7C4DFF", "#4DB8FF", "#2FD0A0", "#FF9A3C"];

type Burst = { id: number; x: number; y: number };

export const ClickSparkles: React.FC = () => {
  const reduce = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);

  const onDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    // Stay out of the way while typing in the form.
    if (target?.closest("input, textarea, select")) return;
    const id = nextId.current++;
    setBursts((b) => [...b.slice(-4), { id, x: e.clientX, y: e.clientY }]);
    window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 750);
  }, []);

  useEffect(() => {
    if (reduce) return;
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, [reduce, onDown]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      {bursts.map((b) => (
        <div key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2 + b.id;
            const dx = Math.round(Math.cos(angle) * 46);
            const dy = Math.round(Math.sin(angle) * 46);
            return (
              <span
                key={i}
                className="sparkle-piece absolute -ml-2 -mt-2 block"
                style={
                  {
                    "--dx": `${dx}px`,
                    "--dy": `${dy}px`,
                  } as React.CSSProperties
                }
              >
                <Shape
                  name={burstShapes[(i + b.id) % 3]}
                  color={burstColors[(i + b.id) % burstColors.length]}
                  className="h-4 w-4"
                />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
