import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { navItems } from "../../config/navigation";

const Navigation: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-1 text-[15px] transition-colors ${
      isActive
        ? "text-ink after:absolute after:inset-x-0 after:-bottom-[21px] after:h-[2px] after:bg-plum"
        : "text-muted hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="page flex h-16 items-center justify-between">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          Sabrina Palmer
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className={linkClass}>
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="-mr-2 rounded p-2 text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-line bg-paper md:hidden"
        >
          <ul className="page flex flex-col py-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block py-3 text-base ${
                      isActive ? "font-medium text-plum" : "text-ink"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Navigation;
