import React from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  artwork: {
    imageUrl: string;
    title: string;
    medium: string;
    description: string;
    dateCreated: string;
  };
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const Lightbox: React.FC<LightboxProps> = React.memo(
  ({ artwork, onClose, onNext, onPrevious }) => {
    // Swipe left/right on phones, where the arrow buttons are hidden.
    const touchStart = React.useRef<{ x: number; y: number } | null>(null);
    const onTouchStart = (e: React.TouchEvent) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onNext();
        else onPrevious();
      }
    };
    // Keep the page behind from scrolling while the viewer is open.
    React.useEffect(() => {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }, []);
    return (
    <motion.div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="fixed top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
      >
        <X size={24} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrevious();
        }}
        aria-label="Previous photo"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors md:block hidden"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Next photo"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors md:block hidden"
      >
        <ChevronRight size={24} />
      </button>

      <div className="w-full h-full flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl w-full h-full flex flex-col">
          <div className="flex items-center justify-center h-full">
            <div
              className="relative h-full aspect-auto max-h-[80vh] max-w-[80vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={artwork.imageUrl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={artwork.imageUrl}
                alt={artwork.title}
                className="h-full w-auto max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
          </div>
          <div
            className="font-josefin text-white mt-4 mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold">{artwork.title}</h3>
            <p className="text-purple-300 capitalize">{artwork.medium}</p>
            <p className="mt-2 text-gray-300">{artwork.description}</p>
            <p className="mt-2 text-gray-400 text-sm">
              {new Date(artwork.dateCreated).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
    );
  }
);

Lightbox.displayName = "Lightbox";

export default Lightbox;
