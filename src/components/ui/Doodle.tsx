import React from "react";
import type { DoodleName } from "../../data/projects";

const INK = "#2B1840";
const C = {
  grape: "#7C4DFF",
  gum: "#FF5FA8",
  tang: "#FF9A3C",
  butter: "#FFD43B",
  mint: "#2FD0A0",
  sky: "#4DB8FF",
  white: "#FFFFFF",
};

const s = {
  stroke: INK,
  strokeWidth: 4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const doodles: Record<DoodleName, React.ReactNode> = {
  leaf: (
    <>
      <path {...s} fill={C.mint} d="M24 92C20 52 46 24 96 22c2 48-24 76-64 74" />
      <path {...s} fill="none" d="M30 90C46 70 62 54 84 36" />
      <path {...s} fill="none" d="M50 70l-2-16M64 56l14 2" />
      <g transform="rotate(-12 86 86)">
        <rect {...s} fill={C.white} x="68" y="74" width="36" height="22" rx="6" />
        <text x="86" y="90" textAnchor="middle" fontFamily="Gluten Variable, sans-serif" fontWeight="700" fontSize="14" fill={INK}>
          0%
        </text>
      </g>
    </>
  ),
  house: (
    <>
      <path {...s} fill={C.white} d="M26 56v40h56V56" />
      <path {...s} fill={C.tang} d="M18 60L54 26l36 34" />
      <rect {...s} fill={C.butter} x="46" y="72" width="16" height="24" rx="2" />
      <rect {...s} fill={C.sky} x="32" y="64" width="10" height="10" rx="2" />
      <circle {...s} fill={C.butter} cx="94" cy="84" r="9" />
      <path {...s} fill="none" d="M94 93v14M94 101h6M94 107h5" />
    </>
  ),
  map: (
    <>
      <path {...s} fill={C.white} d="M16 32l28-10 30 10 30-10v66l-30 10-30-10-28 10z" />
      <path {...s} fill="none" strokeWidth={2.5} d="M44 22v66M74 32v66" />
      <path stroke={C.grape} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 9" fill="none" d="M28 80c10-18 24-6 34-22s22-14 30-26" />
      <path {...s} fill={C.gum} d="M92 18c-9 0-14 7-14 13 0 10 14 22 14 22s14-12 14-22c0-6-5-13-14-13z" />
      <circle cx="92" cy="31" r="4.5" fill={C.white} stroke={INK} strokeWidth={3} />
    </>
  ),
  chart: (
    <>
      <rect {...s} fill={C.white} x="16" y="20" width="88" height="80" rx="10" />
      <path {...s} fill="none" strokeWidth={2.5} d="M28 86h64M28 86V32" />
      <path stroke={C.grape} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M32 76l16-12 14 6 14-20 14-10" />
      {[
        [32, 76],
        [48, 64],
        [62, 70],
        [76, 50],
        [90, 40],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="5" fill={C.butter} stroke={INK} strokeWidth={3} />
      ))}
    </>
  ),
  sparkle: (
    <>
      <path {...s} fill={C.butter} d="M52 18c4 22 10 28 32 32-22 4-28 10-32 32-4-22-10-28-32-32 22-4 28-10 32-32z" />
      <path {...s} fill={C.gum} d="M88 64c2 11 5 14 16 16-11 2-14 5-16 16-2-11-5-14-16-16 11-2 14-5 16-16z" />
      <circle {...s} fill={C.sky} cx="30" cy="92" r="6" />
    </>
  ),
  camera: (
    <>
      <rect {...s} fill={C.gum} x="14" y="36" width="92" height="60" rx="12" />
      <path {...s} fill={C.gum} d="M40 36l6-12h28l6 12" />
      <circle {...s} fill={C.white} cx="60" cy="66" r="19" />
      <circle {...s} fill={C.sky} cx="60" cy="66" r="9" />
      <circle cx="90" cy="48" r="4" fill={C.butter} stroke={INK} strokeWidth={3} />
    </>
  ),
  phone: (
    <>
      <rect {...s} fill={C.white} x="34" y="12" width="52" height="96" rx="12" />
      <path {...s} fill="none" strokeWidth={3} d="M52 22h16" />
      <path stroke={C.sky} strokeWidth={5} strokeLinecap="round" fill="none" d="M48 92c0-14 24-10 24-26s-14-12-14-28" />
      <circle {...s} fill={C.gum} cx="58" cy="36" r="6" />
      <circle {...s} fill={C.mint} cx="48" cy="92" r="5" />
    </>
  ),
};

const Doodle: React.FC<{ name: DoodleName; className?: string }> = ({
  name,
  className,
}) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
    {doodles[name]}
  </svg>
);

export default Doodle;

/* Small decorative shapes used as stickers. */
export const Star: React.FC<{ className?: string; fill?: string }> = ({
  className,
  fill = C.butter,
}) => (
  <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
    <path {...s} strokeWidth={3} fill={fill} d="M30 5l7 16 17 2-13 12 4 17-15-9-15 9 4-17L6 23l17-2z" />
  </svg>
);

export const Flower: React.FC<{ className?: string; fill?: string }> = ({
  className,
  fill = C.gum,
}) => (
  <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
    {[0, 72, 144, 216, 288].map((r) => (
      <ellipse key={r} {...s} strokeWidth={3} fill={fill} cx="30" cy="16" rx="9" ry="12" transform={`rotate(${r} 30 30)`} />
    ))}
    <circle {...s} strokeWidth={3} fill={C.butter} cx="30" cy="30" r="8" />
  </svg>
);

export const Squiggle: React.FC<{ className?: string; color?: string }> = ({
  className,
  color = C.gum,
}) => (
  <svg viewBox="0 0 200 20" className={className} aria-hidden="true" preserveAspectRatio="none">
    <path d="M2 10c12-10 22 10 34 0s22 10 34 0 22 10 34 0 22 10 34 0 22 10 34 0 22 10 26 0" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
  </svg>
);
