import React from "react";

export type CoverName = "nearlyzero" | "curated" | "map";

/* Illustrated previews for projects without a screenshot. Each is a single
   SVG with a fixed viewBox, so it scales cleanly to any card width. */

const Browser: React.FC<{ url: string; bg: string; children: React.ReactNode }> = ({
  url,
  bg,
  children,
}) => (
  <>
    <rect x="0" y="0" width="320" height="200" fill={bg} />
    {children}
    <rect x="0" y="0" width="320" height="22" fill="#FFFFFF" />
    <line x1="0" y1="22" x2="320" y2="22" stroke="#2B1840" strokeWidth="1.5" />
    <circle cx="12" cy="11" r="3.2" fill="#FF5FA8" />
    <circle cx="22" cy="11" r="3.2" fill="#FFD43B" />
    <circle cx="32" cy="11" r="3.2" fill="#2FD0A0" />
    <rect x="46" y="5" width="150" height="12" rx="6" fill="#F1ECF7" />
    <text x="54" y="14" fontFamily="Instrument Sans Variable, system-ui, sans-serif" fontSize="7.5" fill="#6E5F80">
      {url}
    </text>
  </>
);

const serif = "Georgia, 'Times New Roman', serif";
const sans = "Instrument Sans Variable, system-ui, sans-serif";

const NearlyZero = () => (
  <Browser url="wearnearlyzero.com" bg="#F3EBDD">
    <text x="16" y="40" fontFamily={serif} fontSize="9" fontWeight="700" fill="#1F3A5F">
      Nearly Zero
    </text>
    {["Shop", "About", "Bag"].map((t, i) => (
      <text key={t} x={210 + i * 34} y="40" fontFamily={sans} fontSize="7" fill="#1F3A5F">
        {t}
      </text>
    ))}
    <text x="16" y="74" fontFamily={serif} fontSize="19" fill="#1F3A5F">
      Made of
    </text>
    <text x="90" y="74" fontFamily={serif} fontSize="19" fontStyle="italic" fill="#8A6A3F">
      linen,
    </text>
    <text x="16" y="96" fontFamily={serif} fontSize="19" fill="#1F3A5F">
      not plastic.
    </text>
    <text x="16" y="113" fontFamily={sans} fontSize="7.5" fill="#5B5246">
      Soft, breathable clothes you can feel good in.
    </text>
    <rect x="16" y="124" width="66" height="18" rx="9" fill="#1F3A5F" />
    <text x="49" y="136" textAnchor="middle" fontFamily={sans} fontSize="7.5" fontWeight="600" fill="#F3EBDD">
      Start shopping
    </text>
    {["0%", "Under 1%", "Under 3%"].map((t, i) => (
      <g key={t}>
        <rect x={16 + i * 46} y="154" width={t === "0%" ? 26 : 42} height="13" rx="6.5" fill="#FFFFFF" stroke="#1F3A5F" strokeWidth="0.8" />
        <text x={16 + i * 46 + (t === "0%" ? 13 : 21)} y="163" textAnchor="middle" fontFamily={sans} fontSize="6.5" fill="#1F3A5F">
          {t}
        </text>
      </g>
    ))}
    {/* product tiles */}
    {[
      { x: 176, fill: "#E9E1D2", item: "#C9B48F" },
      { x: 224, fill: "#DCE4D6", item: "#8FA98B" },
      { x: 272, fill: "#E8D9D0", item: "#B5694E" },
    ].map((t, i) => (
      <g key={i}>
        <rect x={t.x} y="56" width="42" height="92" rx="5" fill={t.fill} />
        {i === 1 ? (
          <path d={`M${t.x + 15} 70h12l-2 8 9 44H${t.x + 8}l9-44z`} fill={t.item} />
        ) : (
          <path
            d={`M${t.x + 13} 74l6-4h4l6 4 6 7-5 4-3-3v32H${t.x + 15}V82l-3 3-5-4z`}
            fill={t.item}
          />
        )}
        <rect x={t.x + 4} y="152" width="26" height="5" rx="2.5" fill="#1F3A5F" opacity="0.75" />
        <rect x={t.x + 4} y="161" width="18" height="4" rx="2" fill="#8A6A3F" opacity="0.6" />
        <rect x={t.x + 26} y="60" width="13" height="9" rx="4.5" fill="#FFFFFF" />
        <text x={t.x + 32.5} y="66.6" textAnchor="middle" fontFamily={sans} fontSize="5" fontWeight="700" fill="#1F3A5F">
          {["0%", "<1%", "0%"][i]}
        </text>
      </g>
    ))}
    <circle cx="300" cy="186" r="20" fill="#8FA98B" opacity="0.25" />
  </Browser>
);

const Curated = () => (
  <Browser url="thecuratedestates.com" bg="#F7F3EC">
    <rect x="0" y="22" width="320" height="26" fill="#1E2B3C" />
    <text x="16" y="39" fontFamily={serif} fontSize="9" letterSpacing="0.6" fill="#F7F3EC">
      The Curated Estates
    </text>
    {["Services", "Process", "Contact"].map((t, i) => (
      <text key={t} x={200 + i * 38} y="39" fontFamily={sans} fontSize="6.5" fill="#E6D3AE">
        {t}
      </text>
    ))}
    <text x="16" y="80" fontFamily={serif} fontSize="17" fill="#1E2B3C">
      We handle everything.
    </text>
    <text x="16" y="101" fontFamily={serif} fontSize="17" fontStyle="italic" fill="#B08D57">
      So you don't have to.
    </text>
    <text x="16" y="118" fontFamily={sans} fontSize="7.5" fill="#55606C">
      One call. We handle the rest.
    </text>
    <rect x="16" y="130" width="96" height="18" rx="3" fill="#B08D57" />
    <text x="64" y="142" textAnchor="middle" fontFamily={sans} fontSize="7.5" fontWeight="600" fill="#FFFFFF">
      Request a consultation
    </text>
    <rect x="118" y="130" width="70" height="18" rx="3" fill="none" stroke="#1E2B3C" strokeWidth="1" />
    <text x="153" y="142" textAnchor="middle" fontFamily={sans} fontSize="7.5" fill="#1E2B3C">
      Our services
    </text>
    {["Meet", "Plan", "Execute", "Complete"].map((t, i) => (
      <g key={t}>
        <circle cx={22 + i * 46} cy="172" r="6" fill={i === 0 ? "#B08D57" : "#FFFFFF"} stroke="#1E2B3C" strokeWidth="0.8" />
        <text x={22 + i * 46} y="174.5" textAnchor="middle" fontFamily={sans} fontSize="6" fontWeight="700" fill={i === 0 ? "#FFFFFF" : "#1E2B3C"}>
          {i + 1}
        </text>
        <text x={31 + i * 46} y="174.5" fontFamily={sans} fontSize="6.5" fill="#1E2B3C">
          {t}
        </text>
      </g>
    ))}
    {/* gallery wall */}
    <rect x="218" y="60" width="44" height="56" fill="#B08D57" />
    <rect x="222" y="64" width="36" height="48" fill="#D9C7A6" />
    <path d="M222 112l12-18 8 10 6-6 10 14z" fill="#7C8C6E" />
    <circle cx="249" cy="76" r="5" fill="#F2D27A" />
    <rect x="270" y="60" width="34" height="34" fill="#B08D57" />
    <rect x="274" y="64" width="26" height="26" fill="#C9D3DC" />
    <circle cx="287" cy="77" r="7" fill="#1E2B3C" opacity="0.6" />
    {/* side table + vase */}
    <rect x="232" y="150" width="62" height="5" rx="2" fill="#6B4E31" />
    <rect x="238" y="155" width="4" height="30" fill="#6B4E31" />
    <rect x="284" y="155" width="4" height="30" fill="#6B4E31" />
    <path d="M256 150c-8 0-9-12-4-18 1-2 1-6-1-8h14c-2 2-2 6-1 8 5 6 4 18-4 18z" fill="#4A6C8C" />
    <path d="M276 150v-14h10v14z" fill="#E6D3AE" />
    <path d="M270 136c4-10 10-12 18-10" fill="none" stroke="#7C8C6E" strokeWidth="2" />
  </Browser>
);

const MapCover = () => (
  <Browser url="sabrinapalmer.com/map" bg="#EEF6E9">
    {/* blocks and parks */}
    <rect x="0" y="22" width="320" height="178" fill="#F4F1EA" />
    <rect x="196" y="38" width="80" height="54" rx="8" fill="#D6EDCF" />
    <rect x="30" y="128" width="64" height="60" rx="8" fill="#D6EDCF" />
    <path d="M-10 170C60 150 90 196 160 176s110-40 180-30v60H-10z" fill="#BFE3F5" />
    {/* roads */}
    <g stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" fill="none">
      <path d="M0 70h320M0 118h320M120 22v178M248 22v178M40 22l110 178" />
    </g>
    <g stroke="#E2DCCF" strokeWidth="1" fill="none">
      <path d="M0 66h320M0 74h320M0 114h320M0 122h320M116 22v178M124 22v178M244 22v178M252 22v178" />
    </g>
    {/* route */}
    <path d="M72 158 L120 118 L120 70 L248 70 L248 50" fill="none" stroke="#7C4DFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
    <path d="M72 158 L120 118 L120 70 L248 70 L248 50" fill="none" stroke="#FF5FA8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" />
    <circle cx="72" cy="158" r="6" fill="#2FD0A0" stroke="#2B1840" strokeWidth="1.5" />
    <path d="M248 50c-7 0-11-6-11-11 0-6 5-11 11-11s11 5 11 11c0 5-4 11-11 11z" transform="translate(0 -4)" fill="#FF5FA8" stroke="#2B1840" strokeWidth="1.5" />
    <circle cx="248" cy="35" r="3.5" fill="#FFFFFF" />
    {/* search pill */}
    <rect x="12" y="32" width="120" height="22" rx="11" fill="#FFFFFF" stroke="#F3D2DE" strokeWidth="1.2" />
    <circle cx="24" cy="43" r="3" fill="#FF5FA8" />
    <text x="33" y="46" fontFamily={sans} fontSize="8" fill="#8B7F95">
      Where to?
    </text>
    {/* directions card */}
    <rect x="170" y="140" width="138" height="48" rx="10" fill="#FFFFFF" stroke="#2B1840" strokeWidth="1.2" />
    <text x="182" y="157" fontFamily={sans} fontSize="8.5" fontWeight="700" fill="#2B1840">
      Turn left on Oak St
    </text>
    <text x="182" y="169" fontFamily={sans} fontSize="6.5" fill="#6E5F80">
      Fewer left turns against traffic
    </text>
    <rect x="182" y="175" width="40" height="7" rx="3.5" fill="#FFE0EF" />
    <text x="202" y="180.5" textAnchor="middle" fontFamily={sans} fontSize="5" fontWeight="700" fill="#2B1840">
      12 min
    </text>
  </Browser>
);

const covers: Record<CoverName, React.FC> = {
  nearlyzero: NearlyZero,
  curated: Curated,
  map: MapCover,
};

const SiteCover: React.FC<{ name: CoverName; title: string; className?: string }> = ({
  name,
  title,
  className,
}) => {
  const Cover = covers[name];
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`Preview of ${title}`}
    >
      <Cover />
    </svg>
  );
};

export default SiteCover;
