import React, { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import { links, navItems } from "../../config/navigation";
import { Star } from "../ui/Doodle";

const footerLinks = [
  { label: "Nearly Zero", url: "https://www.wearnearlyzero.com" },
  { label: "Map", url: "/map" },
  { label: "Net Worth Ledger", url: "/networth" },
  { label: "The Curated Estates", url: "https://www.thecuratedestates.com" },
  { label: "Playlist Customizer", url: "https://playlistcustomizer.sabrinapalmer.com/" },
];

const Layout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const item = navItems.find((n) => n.path === pathname);
    document.title = item ? `${item.title} | Sabrina Palmer` : "Sabrina Palmer";
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Navigation />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-28 bg-ink text-paper">
        <div className="page grid gap-10 py-12 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Star className="h-8 w-8 animate-spin-slow" />
              <span className="font-display text-2xl font-bold text-paper">
                Sabrina Palmer
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-paper/70">
              Software engineer, film photographer, and maker of small useful
              things.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-butter">Things I made</h2>
            <ul className="mt-3 space-y-1.5">
              {footerLinks.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    className="text-paper/85 underline-offset-4 hover:text-gum hover:underline"
                    {...(l.url.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-mint">Say hi</h2>
            <ul className="mt-3 space-y-1.5">
              <li>
                <a className="text-paper/85 hover:text-gum" href={`mailto:${links.email}`}>
                  {links.email}
                </a>
              </li>
              <li>
                <a
                  className="text-paper/85 hover:text-gum"
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link className="text-paper/85 hover:text-gum" to="/contact">
                  Contact form
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="page pb-8 text-sm text-paper/50">
          © {new Date().getFullYear()} Sabrina Palmer
        </p>
      </footer>
    </div>
  );
};

export default Layout;
