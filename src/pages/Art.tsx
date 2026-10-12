import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
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

      <ul
        key={filter}
        className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4"
      >
        {visible.map((art, i) => (
          <li
            key={art.imageUrl}
            className="animate-[fade-up_0.35s_ease-out_both]"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <button
              type="button"
              onClick={() => setSelected(i)}
              className="relative block w-full border-2 border-ink bg-white p-2 pb-0 text-left shadow-sticker transition-transform duration-200 ease-out [transform:rotate(var(--tilt))] hover:z-10 hover:[transform:rotate(0deg)_scale(1.04)] focus-visible:[transform:rotate(0deg)]"
              style={{ "--tilt": `${tilts[i % tilts.length]}deg` } as React.CSSProperties}
              aria-label={`Open ${art.title}`}
            >
              <img
                src={art.imageUrl}
                alt={art.title}
                loading="lazy"
                width={400}
                height={400}
                className="aspect-square w-full bg-grape-soft object-cover"
              />
              <span className="block truncate px-0.5 py-2 font-display text-[15px] font-semibold leading-tight sm:text-base">
                {art.title}
              </span>
            </button>
          </li>
        ))}
      </ul>

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
