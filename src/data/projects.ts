import Stonemoth from "../assets/projects/Stonemoth.jpg";
import Flawp from "../assets/projects/Flawp.jpg";
import WaywardWarlock from "../assets/projects/WaywardWarlock.jpg";
import SpotifyCustomizer from "../assets/projects/SpotifyCustomizer.jpg";
import Portfolio from "../assets/projects/Portfolio.jpg";
import NetWorthLedger from "../assets/projects/NetWorthLedger.jpg";

export type ProjectType = "websites" | "apps" | "games";

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
  links: ProjectLink[];
  featured?: boolean;
}

export const projectGroups: { type: ProjectType; title: string; intro: string }[] = [
  {
    type: "websites",
    title: "Websites",
    intro: "Sites designed and built for businesses, including my own.",
  },
  {
    type: "apps",
    title: "Apps and tools",
    intro: "Things I built because I wanted to use them.",
  },
  {
    type: "games",
    title: "Games",
    intro: "Game jam entries, each built in a weekend.",
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
      "Shoppers filter by plastic level, from 0% to under 5%, and buy three ways: pieces I've checked by hand and ship myself, picks from other shops, and brands that meet the same standard. Includes favorites, a bag, and checkout.",
    tags: ["HTML", "CSS", "JavaScript", "Vercel Functions", "E-commerce"],
    links: [{ label: "Visit site", url: "https://www.wearnearlyzero.com" }],
    featured: true,
  },
  {
    title: "The Curated Estates",
    type: "websites",
    date: "2026-01",
    summary:
      "Website for a full-service estate sale company: services, how the process works, and consultation requests.",
    tags: ["Next.js", "v0", "Vercel"],
    links: [{ label: "Visit site", url: "https://www.thecuratedestates.com" }],
  },
  {
    title: "Map",
    type: "apps",
    date: "2026-10",
    summary:
      "A map and directions app built on open map data, with no sponsored results.",
    details:
      "Turn-by-turn directions that explain why a route was chosen, opening hours and speed limits, offline use, and a meet-up feature that finds a fair place to meet a friend based on where each of you is and how you're travelling.",
    tags: ["JavaScript", "MapLibre", "OpenStreetMap", "PWA", "iOS"],
    links: [{ label: "Open the app", url: "/map" }],
    featured: true,
  },
  {
    title: "Net Worth Ledger",
    type: "apps",
    date: "2026-10",
    summary:
      "Import CSV exports from any bank and see net worth over time.",
    details:
      "Normalizes each bank's column format, removes duplicate transactions across overlapping exports, and keeps per-account detail you can edit.",
    tags: ["JavaScript", "Data cleaning", "Charts"],
    image: NetWorthLedger,
    links: [{ label: "Open the app", url: "/networth" }],
    featured: true,
  },
  {
    title: "Spotify Playlist Customizer",
    type: "apps",
    date: "2024-10",
    summary:
      "Generates playlist covers from the songs in a playlist and reorders tracks by audio features.",
    details:
      "The app is in Spotify's development mode, so email me for access.",
    tags: ["React", "Node.js", "Spotify API"],
    image: SpotifyCustomizer,
    links: [
      { label: "Live site", url: "https://playlistcustomizer.sabrinapalmer.com/" },
      { label: "Source", url: "https://github.com/sabrinapalmer/spotify-playlist-analyzer" },
    ],
    
  },
  {
    title: "This site",
    type: "apps",
    date: "2024-10",
    summary: "My portfolio, which also hosts the Map and Net Worth Ledger apps.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Vite", "Vercel"],
    image: Portfolio,
    links: [{ label: "Source", url: "https://github.com/sabrinapalmer/portfolio" }],
  },
  {
    title: "Stonemoth",
    type: "games",
    date: "2024-10",
    summary:
      "Ludum Dare 56, theme “Tiny Creatures.” Built in 72 hours with Brad Stevenson.",
    details:
      "Ranked 94th in Innovation and 168th in Theme out of nearly 2,000 entries.",
    tags: ["Unity", "C#"],
    image: Stonemoth,
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
    details:
      "Ranked 792nd in Creativity out of more than 6,000 entries.",
    tags: ["Unity", "C#"],
    image: Flawp,
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
    links: [
      { label: "Source", url: "https://github.com/sabrinapalmer/WaywardWarlock" },
      { label: "Jam page", url: "https://ldjam.com/events/ludum-dare/49/wayward-warlock" },
    ],
  },
];

export const formatMonth = (yyyyMm: string) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};
