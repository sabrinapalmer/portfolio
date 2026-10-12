import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/ui/PageHeader";
import Doodle from "../components/ui/Doodle";
import { artworks, mediums } from "../data/artworks";

const Lightbox = lazy(() => import("../components/ui/Lightbox"));

const ALL = "All";
const tilts = [-2.5, 1.8, -1.2, 2.4, -1.8, 1.2];

const Art: React.FC = () => {
  const [filter, setFilter] = useState<string>(ALL);
  const [selected, setSelected] = useState<number | null>(null);

  const visible = useMemo(
    () => artworks.filter((a) => filter === ALL || a.medium === filter),
    [filter]
  );

  const step = useCallback(
    (delta: number) =>
      setSelected((i) =>
        i === null ? null : (i + delta + visible.length) % visible.length
      ),
    [visible.length]
  );

  return (
    <div className="page">
      <PageHeader
        title="Photography"
        color="#4DB8FF"
        intro="Mostly film photography, plus a piece of furniture I built. Tap a photo to see it big."
        art={<Doodle name="camera" className="h-32 w-32" />}
      >
        <div
          role="group"
          aria-label="Filter by medium"
          className="mt-7 flex flex-wrap gap-3"
        >
          {[ALL, ...mediums].map((m, i) => {
            const count =
              m === ALL
                ? artworks.length
                : artworks.filter((a) => a.medium === m).length;
            const active = filter === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(m)}
                className={`btn !py-1.5 ${
                  active ? ["bg-gum", "bg-sky", "bg-butter"][i % 3] : "bg-white !shadow-none"
                }`}
              >
                {m} <span className="font-normal opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </PageHeader>

      <motion.ul layout className="columns-2 gap-4 sm:gap-6 md:columns-3 lg:columns-4">
        <AnimatePresence mode="popLayout">
          {visible.map((art, i) => (
            <motion.li
              layout
              key={art.imageUrl}
              className="mb-5 break-inside-avoid sm:mb-7"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: tilts[i % tilts.length] }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ rotate: 0, scale: 1.04, zIndex: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <button
                type="button"
                onClick={() => setSelected(i)}
                className="block w-full border-2 border-ink bg-white p-2 pb-0 text-left shadow-sticker"
                aria-label={`Open ${art.title}`}
              >
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  loading="lazy"
                  className="w-full"
                />
                <span className="block px-0.5 py-2 font-display text-base font-semibold leading-tight">
                  {art.title}
                </span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {selected !== null && visible[selected] && (
        <Suspense fallback={null}>
          <Lightbox
            artwork={visible[selected]}
            position={`${selected + 1} of ${visible.length}`}
            onClose={() => setSelected(null)}
            onNext={() => step(1)}
            onPrevious={() => step(-1)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Art;
