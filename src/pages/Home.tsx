import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Profile from "../assets/profile.png";
import { artworks } from "../data/artworks";
import { projects, inTheWorks, accentSoft } from "../data/projects";
import { employers } from "../data/experience";
import { links } from "../config/navigation";
import { BouncyText, Marquee, PopIn } from "../components/ui/Motion";
import ProjectCard from "../components/ui/ProjectCard";
import Doodle, { Flower, Squiggle, Star } from "../components/ui/Doodle";

const photo = (title: string) => artworks.find((a) => a.title === title)!;

/* ---------- hero sticker playground ---------- */

type StickerDef = {
  key: string;
  style: React.CSSProperties;
  rotate: number;
  delay: number;
  node: React.ReactNode;
  label: string;
};

const Polaroid: React.FC<{ src: string; caption: string; w: string }> = ({
  src,
  caption,
  w,
}) => (
  <div className={`border-2 border-ink bg-white p-1.5 pb-0 shadow-sticker ${w}`}>
    <img src={src} alt="" draggable={false} className="aspect-square w-full object-cover" />
    <p className="py-1 text-center font-display text-sm font-semibold leading-tight">{caption}</p>
  </div>
);

const Playground: React.FC = () => {
  const area = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const stickers: StickerDef[] = [
    {
      key: "me",
      label: "Photo of Sabrina",
      style: { left: "30%", top: "18%" },
      rotate: -4,
      delay: 0.5,
      node: (
        <div className="h-36 w-36 overflow-hidden rounded-full border-2 border-ink bg-gum-soft shadow-sticker-lg sm:h-44 sm:w-44">
          <img src={Profile} alt="" draggable={false} className="h-full w-full object-cover object-top" />
        </div>
      ),
    },
    {
      key: "tower",
      label: "Smile Tower photo",
      style: { left: "2%", top: "4%" },
      rotate: -9,
      delay: 0.65,
      node: <Polaroid src={photo("Smile Tower").imageUrl} caption="smile tower" w="w-28 sm:w-32" />,
    },
    {
      key: "calf",
      label: "Calf and mother photo",
      style: { right: "3%", top: "2%" },
      rotate: 7,
      delay: 0.75,
      node: <Polaroid src={photo("Calf and Mother").imageUrl} caption="calf + mom" w="w-28 sm:w-32" />,
    },
    {
      key: "sticks",
      label: "Sunset photo",
      style: { right: "6%", bottom: "4%" },
      rotate: -6,
      delay: 0.85,
      node: <Polaroid src={photo("Sticks at Sunset, Moonrise").imageUrl} caption="moonrise" w="w-24 sm:w-28" />,
    },
    {
      key: "map",
      label: "Map sticker",
      style: { left: "4%", bottom: "6%" },
      rotate: 8,
      delay: 0.95,
      node: (
        <div className="rounded-3xl border-2 border-ink bg-sky-soft p-2 shadow-sticker">
          <Doodle name="map" className="h-20 w-20" />
        </div>
      ),
    },
    {
      key: "leaf",
      label: "Nearly Zero sticker",
      style: { left: "40%", bottom: "2%" },
      rotate: -10,
      delay: 1.05,
      node: (
        <div className="rounded-full border-2 border-ink bg-mint-soft p-2 shadow-sticker">
          <Doodle name="leaf" className="h-16 w-16" />
        </div>
      ),
    },
    {
      key: "star",
      label: "Star sticker",
      style: { left: "26%", top: "2%" },
      rotate: 12,
      delay: 1.15,
      node: <Star className="h-12 w-12 drop-shadow-[3px_3px_0_#2B1840]" />,
    },
    {
      key: "flower",
      label: "Flower sticker",
      style: { right: "30%", top: "44%" },
      rotate: 0,
      delay: 1.2,
      node: <Flower className="h-14 w-14 drop-shadow-[3px_3px_0_#2B1840]" fill="#FF9A3C" />,
    },
  ];

  return (
    <div
      ref={area}
      className="relative h-[380px] rounded-[28px] border-2 border-dashed border-grape/50 bg-white/40 sm:h-[460px]"
    >
      {stickers.map((s) => (
        <motion.div
          key={s.key}
          aria-label={s.label}
          role="img"
          className="absolute cursor-grab touch-none active:cursor-grabbing"
          style={s.style}
          drag={!reduce}
          dragConstraints={area}
          dragElastic={0.2}
          dragMomentum
          initial={reduce ? false : { scale: 0, rotate: s.rotate - 30 }}
          animate={{ scale: 1, rotate: s.rotate }}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileDrag={{ scale: 1.12, rotate: 0, zIndex: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 16, delay: s.delay }}
        >
          {s.node}
        </motion.div>
      ))}
      <p className="pointer-events-none absolute -bottom-9 right-2 flex items-center gap-1 font-display text-base font-semibold text-grape">
        <svg viewBox="0 0 40 30" className="h-6 w-8" aria-hidden>
          <path d="M36 26C26 24 14 18 8 6M8 6l-2 9M8 6l8 3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        go ahead, drag them around
      </p>
    </div>
  );
};

/* ---------- career route ---------- */

const pins = [
  { x: 125, y: 62 },
  { x: 375, y: 118 },
  { x: 625, y: 52 },
  { x: 875, y: 112 },
];
const ROUTE =
  "M0 95 C 60 95, 70 62, 125 62 S 300 118, 375 118 S 560 52, 625 52 S 820 112, 875 112 S 960 80, 1000 80";
const pinColors = ["#4DB8FF", "#2FD0A0", "#FFD43B", "#FF5FA8"];

const CareerRoute: React.FC = () => {
  const reduce = useReducedMotion();
  const roles = [...employers[0].roles].reverse();
  return (
    <div className="sticker relative overflow-hidden bg-white p-5 sm:p-8">
      <div className="hidden md:block">
        <svg viewBox="0 0 1000 150" className="w-full overflow-visible" aria-hidden>
          <path
            d={ROUTE}
            fill="none"
            stroke="#2B1840"
            strokeOpacity="0.25"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="2 14"
          />
          <motion.path
            d={ROUTE}
            fill="none"
            stroke="#7C4DFF"
            strokeWidth="6"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          />
          {pins.map((p, i) => (
            <motion.g
              key={i}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.4 + i * 0.45 }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            >
              <path
                d={`M${p.x} ${p.y} C${p.x - 5} ${p.y - 10} ${p.x - 18} ${p.y - 22} ${p.x - 18} ${p.y - 34} A18 18 0 1 1 ${p.x + 18} ${p.y - 34} C${p.x + 18} ${p.y - 22} ${p.x + 5} ${p.y - 10} ${p.x} ${p.y} Z`}
                fill={pinColors[i]}
                stroke="#2B1840"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <circle cx={p.x} cy={p.y - 34} r="7" fill="#fff" stroke="#2B1840" strokeWidth="3" />
            </motion.g>
          ))}
        </svg>
        <ol className="grid grid-cols-4 gap-4 text-center">
          {roles.map((r) => (
            <li key={r.title}>
              <p className="font-display text-xl font-bold">{r.title}</p>
              <p className="text-[15px] text-muted">
                {r.start} – {r.end}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <ol className="relative space-y-6 border-l-[3px] border-dashed border-ink/60 pl-6 md:hidden">
        {roles.map((r, i) => (
          <li key={r.title} className="relative">
            <span
              className="absolute -left-[35px] top-1 h-5 w-5 rounded-full border-2 border-ink"
              style={{ background: pinColors[i] }}
              aria-hidden
            />
            <p className="font-display text-xl font-bold">{r.title}</p>
            <p className="text-[15px] text-muted">
              {r.start} – {r.end}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};

/* ---------- page ---------- */

const ribbon = [
  "Websites",
  "Apps",
  "Games",
  "Film photography",
  "Data dashboards",
  "Maps",
  "Plastic-free clothes",
];

const filmRoll = [
  "Sticks at Sunset, Moonrise",
  "Smile Tower",
  "Calf and Mother",
  "Baháʼí Temple in Fog",
  "Camel Rock",
  "Film Burn at the Fire Station",
  "Moiré",
  "Rock Building",
  "Griffith Observatory",
  "Flowers",
].map(photo);

const Home: React.FC = () => {
  const featured = projects.filter((p) => p.featured);

  return (
    <>
      {/* Hero */}
      <section className="page grid items-center gap-14 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        <div>
          <p className="font-display text-xl font-semibold text-grape sm:text-2xl">
            hi there, I'm
          </p>
          <h1 className="mt-1 text-[3.6rem] font-extrabold leading-[0.95] sm:text-[5.4rem]">
            <BouncyText text="Sabrina" delay={0.1} />
            <br />
            <BouncyText text="Palmer" className="text-gum" delay={0.45} />
          </h1>
          <Squiggle className="mt-3 h-4 w-48" color="#FFD43B" />
          <p className="mt-6 max-w-prose text-lg sm:text-xl">
            I'm a{" "}
            <span className="rounded-md bg-sky-soft px-1.5 font-semibold">software engineer</span>,{" "}
            a{" "}
            <span className="rounded-md bg-gum-soft px-1.5 font-semibold">film photographer</span>,
            and a{" "}
            <span className="rounded-md bg-mint-soft px-1.5 font-semibold">maker of small useful things</span>.
            After five-plus years building data tools at Splunk, I make my own apps,
            run a plastic-free clothing shop, and enter game jams for fun.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/projects" className="btn bg-butter">
              See what I've made
            </Link>
            <a href={`mailto:${links.email}`} className="btn bg-white">
              Email me
            </a>
          </div>
        </div>
        <Playground />
      </section>

      {/* Ribbon */}
      <div className="-mx-4 my-10 -rotate-2 border-y-2 border-ink bg-grape py-3 text-white shadow-sticker">
        <Marquee>
          {ribbon.map((r) => (
            <span key={r} className="flex items-center gap-6 px-3 font-display text-2xl font-bold">
              {r}
              <Star className="h-7 w-7" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* New and shiny */}
      <section className="page mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="section-title">
            New and shiny
            <Squiggle className="mt-1 h-3 w-40" color="#2FD0A0" />
          </h2>
          <Link to="/projects" className="link">
            All projects
          </Link>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {featured.map((p, i) => (
            <PopIn key={p.title} delay={(i % 2) * 0.1}>
              <ProjectCard project={p} tilt={i % 2 ? 1.2 : -1.2} />
            </PopIn>
          ))}
        </div>
      </section>

      {/* In the works */}
      <section className="page mt-20">
        <h2 className="section-title">In the works</h2>
        <p className="mt-2 text-muted">Things I'm building right now.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {inTheWorks.map((w, i) => (
            <PopIn key={w.title} rotate={i % 2 ? 1.5 : -1.5} delay={i * 0.08}>
              <div className={`sticker flex items-center gap-5 p-5 ${accentSoft[w.accent]}`}>
                <Doodle name={w.doodle} className="h-20 w-20 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold">{w.title}</h3>
                  <p className="mt-1 text-[15px]">{w.summary}</p>
                </div>
              </div>
            </PopIn>
          ))}
        </div>
      </section>

      {/* Film roll */}
      <section className="mt-24" aria-labelledby="film-heading">
        <div className="page flex flex-wrap items-end justify-between gap-4">
          <h2 id="film-heading" className="section-title">
            Off the film roll
          </h2>
          <Link to="/art" className="link">
            See all photos
          </Link>
        </div>
        <div className="film-strip mt-8">
          <Marquee slow>
            {filmRoll.map((a) => (
              <Link key={a.title} to="/art" className="mx-1 block shrink-0" aria-label={`${a.title}, see all photos`}>
                <img
                  src={a.imageUrl}
                  alt={a.title}
                  loading="lazy"
                  className="h-44 w-64 object-cover transition-transform duration-300 hover:scale-[1.04] sm:h-52 sm:w-72"
                />
              </Link>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Career */}
      <section className="page mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="section-title">The route so far</h2>
          <Link to="/experience" className="link">
            Full experience
          </Link>
        </div>
        <p className="mt-2 max-w-prose text-muted">
          Splunk, 2018 to 2024: from sales engineering intern to building data pipelines
          and dashboards for the sales engineering organization.
        </p>
        <div className="mt-8">
          <CareerRoute />
        </div>
      </section>

      {/* Say hi */}
      <section className="page mt-24">
        <PopIn rotate={-1}>
          <div className="sticker relative overflow-hidden bg-gum px-6 py-12 text-center sm:px-12">
            <Star className="absolute left-6 top-6 h-10 w-10 animate-spin-slow" />
            <Flower className="absolute bottom-6 right-8 h-12 w-12 animate-bob" fill="#FFD43B" />
            <h2 className="text-5xl font-extrabold text-white [text-shadow:3px_3px_0_#2B1840] sm:text-6xl">
              <BouncyText text="Say hi!" />
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-ink">
              Projects, collaborations, or access to one of my apps: I'd love to hear
              from you.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href={`mailto:${links.email}`} className="btn bg-butter">
                {links.email}
              </a>
              <Link to="/contact" className="btn bg-white">
                Contact form
              </Link>
              <a href={links.github} target="_blank" rel="noopener noreferrer" className="btn bg-white">
                GitHub
              </a>
            </div>
          </div>
        </PopIn>
      </section>
    </>
  );
};

export default Home;
