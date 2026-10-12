import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navItems } from "../../config/navigation";
import { Flower } from "../ui/Doodle";

const blobColor: Record<string, string> = {
  "/experience": "bg-butter",
  "/projects": "bg-mint",
  "/art": "bg-gum",
  "/contact": "bg-sky",
};

const Navigation: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 pt-3">
      <div className="page">
        <div className="flex h-14 items-center justify-between rounded-full border-2 border-ink bg-white/90 pl-3 pr-2 shadow-sticker backdrop-blur">
          <Link to="/" className="group flex items-center gap-2">
            <Flower className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[72deg]" />
            <span className="font-display text-xl font-bold leading-none">
              Sabrina Palmer
            </span>
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className="relative block rounded-full px-4 py-1.5 text-[15px] font-semibold"
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-blob"
                            className={`absolute inset-0 rounded-full border-2 border-ink ${blobColor[item.path]}`}
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                          />
                        )}
                        <span className="relative">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="rounded-full border-2 border-ink bg-butter p-1.5 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobile-nav"
              aria-label="Main"
              className="sticker mt-2 p-2 md:hidden"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `block rounded-2xl px-4 py-3 text-lg font-semibold ${
                          isActive ? `${blobColor[item.path]} border-2 border-ink` : ""
                        }`
                      }
                    >
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navigation;
