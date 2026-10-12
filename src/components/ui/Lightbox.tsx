import React, { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Artwork, formatArtDate } from "../../data/artworks";

interface LightboxProps {
  artwork: Artwork;
  position: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  artwork,
  position,
  onClose,
  onNext,
  onPrevious,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrevious();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrevious]);

  const btn =
    "rounded-full p-2.5 text-paper/80 transition-colors hover:bg-white/10 hover:text-paper";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
      className="fixed inset-0 z-50 flex flex-col bg-film"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-paper/70">
        <span>{position}</span>
        <button
          ref={closeRef}
          type="button"
          className={btn}
          aria-label="Close"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
        <img
          key={artwork.imageUrl}
          src={artwork.imageUrl}
          alt={artwork.title}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
        <button
          type="button"
          aria-label="Previous"
          className={`${btn} absolute left-2 top-1/2 -translate-y-1/2`}
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
        >
          <ChevronLeft size={26} />
        </button>
        <button
          type="button"
          aria-label="Next"
          className={`${btn} absolute right-2 top-1/2 -translate-y-1/2`}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <ChevronRight size={26} />
        </button>
      </div>

      <div
        className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4 text-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-semibold text-paper">
          {artwork.title}
        </h2>
        <p className="mt-1 text-paper/70">{artwork.description}</p>
        <p className="mt-1 text-sm text-paper/50">
          {artwork.medium}, {formatArtDate(artwork.dateCreated)}
        </p>
      </div>
    </div>
  );
};

export default Lightbox;
