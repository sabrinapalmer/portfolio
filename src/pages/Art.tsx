import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { artworks, mediums } from "../data/artworks";

const Lightbox = lazy(() => import("../components/ui/Lightbox"));

const ALL = "All";

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
        intro="Mostly film photography, plus a piece of furniture I built. Select a photo to see it full size."
      >
        <div
          role="group"
          aria-label="Filter by medium"
          className="mt-6 flex flex-wrap gap-2"
        >
          {[ALL, ...mediums].map((m) => {
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
                className={`rounded border px-3.5 py-1.5 text-[15px] transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
              >
                {m} <span className={active ? "text-paper/70" : "text-muted"}>{count}</span>
              </button>
            );
          })}
        </div>
      </PageHeader>

      <ul className="columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
        {visible.map((art, i) => (
          <li key={art.imageUrl} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setSelected(i)}
              className="group block w-full text-left"
              aria-label={`Open ${art.title}`}
            >
              <img
                src={art.imageUrl}
                alt={art.title}
                loading="lazy"
                className="w-full rounded-sm transition-opacity group-hover:opacity-90"
              />
              <span className="mt-1.5 block text-sm text-muted group-hover:text-ink">
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
