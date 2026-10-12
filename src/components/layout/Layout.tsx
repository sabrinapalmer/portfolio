import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import { links, navItems } from "../../config/navigation";

const Layout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const item = navItems.find((n) => n.path === pathname);
    document.title = item ? `${item.title} | Sabrina Palmer` : "Sabrina Palmer";
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Navigation />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-24 border-t border-line">
        <div className="page flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Sabrina Palmer</p>
          <div className="flex gap-6">
            <a className="hover:text-ink" href={`mailto:${links.email}`}>
              Email
            </a>
            <a
              className="hover:text-ink"
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
