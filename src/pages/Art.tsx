import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { pageTransition } from "../utils/animation";
import CoffeeTable from "../assets/art/coffeetable.png";
import FilmLandscape1 from "../assets/art/film_landscape1.jpg";
import FilmLandscape2 from "../assets/art/film_landscape2.jpeg";
import FilmLandscape3 from "../assets/art/film_landscape3.jpeg";
import FilmGriffith from "../assets/art/film_griffith.jpeg";
import FilmBuilding from "../assets/art/film_building.jpeg";
import FilmFlowers from "../assets/art/film_flowers.jpg";

type Medium =
  | "All"
  | "Painting"
  | "Film Photography"
  | "Digital Photography"
  | "Wood";

interface Artwork {
  title: string;
  medium: string;
  description: string;
  imageUrl: string;
}

const artworks: Artwork[] = [
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "",
    imageUrl: FilmLandscape1,
  },
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "",
    imageUrl: FilmLandscape2,
  },
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "",
    imageUrl: FilmLandscape3,
  },
  {
    title: "Griffith Observatory on Film",
    medium: "Film Photography",
    description: "",
    imageUrl: FilmGriffith,
  },
  {
    title: "Flowers on Film",
    medium: "Film Photography",
    description: "",
    imageUrl: FilmFlowers,
  },
  {
    title: "Building on Film",
    medium: "Film Photography",
    description: "",
    imageUrl: FilmBuilding,
  },
  {
    title: "Recycled Wood Coffee Table",
    medium: "Wood",
    description: "Coffee table made from old bed frame.",
    imageUrl: CoffeeTable,
  },
];

const FilterButton: React.FC<{
  medium: Medium;
  currentFilter: Medium;
  onClick: (medium: Medium) => void;
}> = ({ medium, currentFilter, onClick }) => (
  <button
    onClick={() => onClick(medium)}
    className={`font-josefin px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-xs ${
      currentFilter === medium
        ? "font-josefin bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-md"
        : "font-josefin bg-white/90 text-gray-600 hover:text-purple-500 hover:bg-purple-50"
    }`}
  >
    {medium.charAt(0).toUpperCase() + medium.slice(1)}
  </button>
);

const Art: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentFilter, setCurrentFilter] = useState<Medium>("All");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const filteredArtworks = artworks.filter(
    (artwork) => currentFilter === "All" || artwork.medium === currentFilter
  );

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handlePrevious = useCallback(() => {
    if (selectedImage === null) return;
    setSelectedImage((prev) =>
      prev === null ? null : prev === 0 ? filteredArtworks.length - 1 : prev - 1
    );
  }, [selectedImage, filteredArtworks.length]);

  const handleNext = useCallback(() => {
    if (selectedImage === null) return;
    setSelectedImage((prev) =>
      prev === null ? null : prev === filteredArtworks.length - 1 ? 0 : prev + 1
    );
  }, [selectedImage, filteredArtworks.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage === null) return;

      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedImage, handlePrevious, handleNext]);

  return (
    <motion.div {...pageTransition}>
      <div className="space-y-8">
        <div>
          <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 inline-flex items-center backdrop-blur-xs">
            Art Gallery
            <Palette className="text-pink-500 ml-2 mt-[-4px]" size={20} />
          </h2>

          <div className="flex flex-wrap gap-2">
            {(
              [
                "All",
                "Painting",
                "Film Photography",
                "Digital Photography",
                "Wood",
              ] as Medium[]
            ).map((medium) => (
              <FilterButton
                key={medium}
                medium={medium}
                currentFilter={currentFilter}
                onClick={setCurrentFilter}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredArtworks.map((artwork, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(index)}
              className="group relative aspect-square rounded-xl overflow-hidden backdrop-blur-xs cursor-pointer"
            >
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="object-cover w-full h-full transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="font-josefin text-white">
                  <h3 className="font-semibold">{artwork.title}</h3>
                  <p className="text-sm text-purple-200">{artwork.medium}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close button with better positioning and z-index */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="fixed top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors md:block hidden"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors md:block hidden"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>

            <div
              className="w-full h-full flex flex-col items-center justify-center px-4"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="max-w-4xl w-full h-full flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative flex-1 min-h-0">
                  <motion.img
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={filteredArtworks[selectedImage].imageUrl}
                    alt={filteredArtworks[selectedImage].title}
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                <div className="font-josefin text-white mt-4 mb-8">
                  <h3 className="font-josefin text-xl font-semibold">
                    {filteredArtworks[selectedImage].title}
                  </h3>
                  <p className="font-josefin text-purple-300 capitalize">
                    {filteredArtworks[selectedImage].medium}
                  </p>
                  <p className="font-josefin mt-2 text-gray-300">
                    {filteredArtworks[selectedImage].description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Art;
