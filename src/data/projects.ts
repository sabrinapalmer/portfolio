import Stonemoth from "../assets/projects/Stonemoth.jpg";
import Flawp from "../assets/projects/Flawp.jpg";
import WaywardWarlock from "../assets/projects/WaywardWarlock.jpg";
import SpotifyCustomizer from "../assets/projects/SpotifyCustomizer.jpg";
import NetWorthShot from "../assets/projects/NetWorthLedger.jpg";
import ThisSiteShot from "../assets/projects/ThisSite.jpg";
import type { CoverName } from "../components/ui/SiteCover";

export type ProjectType = "websites" | "apps" | "games";
export type Accent = "grape" | "gum" | "tang" | "butter" | "mint" | "sky";
export type DoodleName =
  | "leaf"
  | "house"
  | "map"
  | "chart"
  | "sparkle"
  | "camera"
  | "phone";

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  title: string;
  type: ProjectType;
  date: string; // YYYY-MM
  summary: string;
  details?: string;
  tags: string[];
  image?: string;
  doodle?: DoodleName;
  cover?: CoverName;
  accent: Accent;
  links: ProjectLink[];
  featured?: boolean;
}

export const projectGroups: {
  type: ProjectType;
  title: string;
  intro: string;
  accent: Accent;
}[] = [
  {
    type: "websites",
    title: "Websites",
    intro: "Sites designed and built for real businesses, including my own.",
    accent: "mint",
  },
  {
    type: "apps",
    title: "Apps and tools",
    intro: "Things I built because I wanted to use them.",
    accent: "sky",
  },
  {
    type: "games",
    title: "Games",
    intro: "Game jam entries, each built in a single weekend.",
    accent: "gum",
  },
];

export const projects: Project[] = [
  {
    title: "Nearly Zero",
    type: "websites",
    date: "2026-09",
    summary:
      "My online shop for clothing made of natural fibers, with every piece tagged by how much plastic it contains.",
    details:
      "Filter by plastic level from 0% to under 5%, and buy three ways: pieces I've checked by hand and ship myself, picks from other shops, and brands that meet the same standard.",
    tags: ["HTML", "CSS", "JavaScript", "Vercel Functions", "E-commerce"],
    doodle: "leaf",
    cover: "nearlyzero",
    accent: "mint",
    links: [{ label: "Visit wearnearlyzero.com", url: "https://www.wearnearlyzero.com" }],
    featured: true,
  },
  {
    title: "Map",
    type: "apps",
    date: "2026-10",
    summary:
      "A map and directions app built on open map data, with no sponsored results.",
    details:
      "Turn-by-turn directions that explain why a route was chosen, opening hours and speed limits, offline use, and a meet-up feature that finds a fair place to meet a friend based on where each of you is and how you're travelling.",
    tags: ["JavaScript", "MapLibre", "OpenStreetMap", "PWA"],
    doodle: "map",
    cover: "map",
    accent: "sky",
    links: [{ label: "Open the map", url: "/map" }],
    featured: true,
  },
  {
    title: "Net Worth Ledger",
    type: "apps",
    date: "2026-10",
    summary: "Import CSV exports from any bank and see net worth over time.",
    details:
      "Guided setup for every kind of account, column matching for each bank's format, duplicate removal across overlapping exports, and per-account detail you can edit. Nothing connects to a bank and files never leave the browser.",
    tags: ["JavaScript", "Data cleaning", "Charts"],
    doodle: "chart",
    image: NetWorthShot,
    accent: "butter",
    links: [{ label: "Open the ledger", url: "/networth" }],
    featured: true,
  },
  {
    title: "The Curated Estates",
    type: "websites",
    date: "2026-01",
    summary:
      "Website for a full-service estate sale company: services, how the process works, and consultation requests.",
    tags: ["Next.js", "v0", "Vercel"],
    doodle: "house",
    cover: "curated",
    accent: "tang",
    links: [
      { label: "Visit thecuratedestates.com", url: "https://www.thecuratedestates.com" },
    ],
    featured: true,
  },
  {
    title: "Spotify Playlist Customizer",
    type: "apps",
    date: "2024-10",
    summary:
      "Generates playlist covers from the songs in a playlist and reorders tracks by audio features.",
    details: "The app is in Spotify's development mode, so email me for access.",
    tags: ["React", "Node.js", "Spotify API"],
    image: SpotifyCustomizer,
    accent: "mint",
    links: [
      { label: "Live site", url: "https://playlistcustomizer.sabrinapalmer.com/" },
    ],
  },
  {
    title: "This site",
    type: "apps",
    date: "2024-10",
    summary: "My portfolio, which also hosts the Map and Net Worth Ledger apps.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
    doodle: "sparkle",
    image: ThisSiteShot,
    accent: "grape",
    links: [{ label: "Source", url: "https://github.com/sabrinapalmer/portfolio" }],
  },
  {
    title: "Stonemoth",
    type: "games",
    date: "2024-10",
    summary:
      "Ludum Dare 56, theme “Tiny Creatures.” Built in 72 hours with Brad Stevenson.",
    details: "Ranked 94th in Innovation and 168th in Theme out of nearly 2,000 entries.",
    tags: ["Unity", "C#"],
    image: Stonemoth,
    accent: "gum",
    links: [
      { label: "Play", url: "https://bradjste.itch.io/stonemoth" },
      { label: "Source", url: "https://github.com/sabrinapalmer/STONEMOTH" },
      { label: "Jam page", url: "https://ldjam.com/events/ludum-dare/56/ld56-game" },
    ],
  },
  {
    title: "Flawp",
    type: "games",
    date: "2022-07",
    summary:
      "GMTK Game Jam 2022, theme “Roll of the Dice.” Built with Brad Stevenson.",
    details: "Ranked 792nd in Creativity out of more than 6,000 entries.",
    tags: ["Unity", "C#"],
    image: Flawp,
    accent: "grape",
    links: [
      { label: "Play", url: "https://bradjste.itch.io/flawp" },
      { label: "Jam page", url: "https://itch.io/jam/gmtk-jam-2022/rate/1625103" },
    ],
  },
  {
    title: "Wayward Warlock",
    type: "games",
    date: "2021-10",
    summary:
      "Ludum Dare 49, theme “Unstable.” Built with a team of four against nearly 3,000 entries.",
    tags: ["Unity", "C#"],
    image: WaywardWarlock,
    accent: "sky",
    links: [
      { label: "Source", url: "https://github.com/sabrinapalmer/WaywardWarlock" },
      { label: "Jam page", url: "https://ldjam.com/events/ludum-dare/49/wayward-warlock" },
    ],
  },
];

export const inTheWorks: {
  title: string;
  summary: string;
  doodle: DoodleName;
  accent: Accent;
}[] = [
  {
    title: "Map for iPhone",
    summary:
      "The Map as a native iPhone app, so directions keep going with the screen locked.",
    doodle: "phone",
    accent: "sky",
  },
  {
    title: "A photo app that feels like a museum",
    summary:
      "Photo sharing organized into rooms you curate, laid out as a mosaic. No ads, no endless feed.",
    doodle: "camera",
    accent: "gum",
  },
];

export const formatMonth = (yyyyMm: string) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

export const accentBg: Record<Accent, string> = {
  grape: "bg-grape",
  gum: "bg-gum",
  tang: "bg-tang",
  butter: "bg-butter",
  mint: "bg-mint",
  sky: "bg-sky",
};

export const accentSoft: Record<Accent, string> = {
  grape: "bg-grape-soft",
  gum: "bg-gum-soft",
  tang: "bg-tang-soft",
  butter: "bg-butter-soft",
  mint: "bg-mint-soft",
  sky: "bg-sky-soft",
};
