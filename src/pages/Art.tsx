import React, { useState, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { pageTransition } from "../utils/animation";

// Import images
import CoffeeTable from "../assets/art/coffeetable.png";
import FilmLandscape1 from "../assets/art/film_landscape1.jpg";
import FilmLandscape2 from "../assets/art/film_landscape2.jpeg";
import FilmLandscape3 from "../assets/art/film_landscape3.jpeg";
import FilmLandscape4 from "../assets/art/film_landscape4.jpeg";
import FilmGriffith from "../assets/art/film_griffith.jpeg";
import FilmBuilding from "../assets/art/film_building.jpeg";
import FilmFlowers from "../assets/art/film_flowers.jpg";
import FilmBhai from "../assets/art/film_bhai.jpg";
import FilmCalfAndMom from "../assets/art/film_calfandmom.jpg";
import FilmCamelRock from "../assets/art/film_camelrock.jpg";
import FilmFire from "../assets/art/film_fire.jpg";
import FilmMoirePattern from "../assets/art/film_moirepattern.jpg";
import FilmRockBuilding from "../assets/art/film_rockbuilding.jpg";
import FilmSmileTower from "../assets/art/film_smiletower.jpg";
import FilmSunsetSticks from "../assets/art/film_sunsetsticks.jpeg";

// Lazy load the lightbox component
const Lightbox = lazy(() => import("../components/ui/Lightbox"));

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
  dateCreated: string;
}

// Complete artworks array
const artworks: Artwork[] = [
  {
    title: "Sticks at Sunset, Moonrise",
    medium: "Film Photography",
    description: "Moon, sticks, and their shadows, captured at sunset on film",
    imageUrl: FilmSunsetSticks,
    dateCreated: "2024-01-20",
  },
  {
    title: "Rock Building",
    medium: "Film Photography",
    description: "Building build out of the rocks, captured on film",
    imageUrl: FilmRockBuilding,
    dateCreated: "2024-01-19",
  },
  {
    title: "Camel Rock Formation",
    medium: "Film Photography",
    description: "Natural rock formation resembling a camel, captured on film",
    imageUrl: FilmCamelRock,
    dateCreated: "2024-01-18",
  },
  {
    title: "Calf and Mother",
    medium: "Film Photography",
    description: "Calf and mother captured in the same pose",
    imageUrl: FilmCalfAndMom,
    dateCreated: "2024-01-16",
  },
  {
    title: "Smile Tower",
    medium: "Film Photography",
    description: "Water tower with a big smile, captured on film",
    imageUrl: FilmSmileTower,
    dateCreated: "2024-01-15",
  },
  {
    title: "Film Burn at Fire Station",
    medium: "Film Photography",
    description:
      "Film Burn (first of the roll) at the Lincoln Fire Station - with a phone booth on the roof",
    imageUrl: FilmFire,
    dateCreated: "2024-01-15",
  },
  {
    title: "Moiré Pattern",
    medium: "Film Photography",
    description: "Moiré Pattern occurring in a shadow, captured on film",
    imageUrl: FilmMoirePattern,
    dateCreated: "2023-08-18",
  },
  {
    title: "Baháʼí in the Fog",
    medium: "Film Photography",
    description: "Baháʼí on a foggy day, captured on film",
    imageUrl: FilmBhai,
    dateCreated: "2023-02-10",
  },
  {
    title: "Recycled Wood Coffee Table",
    medium: "Wood",
    description: "Coffee table made from old bed frame.",
    imageUrl: CoffeeTable,
    dateCreated: "2022-04-10",
  },
  {
    title: "Building on Film",
    medium: "Film Photography",
    description: "Architectural study",
    imageUrl: FilmBuilding,
    dateCreated: "2021-03-15",
  },
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "Natural landscape study",
    imageUrl: FilmLandscape1,
    dateCreated: "2021-02-28",
  },
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "Natural landscape study",
    imageUrl: FilmLandscape2,
    dateCreated: "2021-11-15",
  },
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "Natural landscape study",
    imageUrl: FilmLandscape3,
    dateCreated: "2021-09-20",
  },
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "Natural landscape study",
    imageUrl: FilmLandscape4,
    dateCreated: "2021-07-05",
  },
  {
    title: "Flowers on Film",
    medium: "Film Photography",
    description: "Bright flowers captured on film",
    imageUrl: FilmFlowers,
    dateCreated: "2018-08-30",
  },
  {
    title: "Griffith Observatory on Film",
    medium: "Film Photography",
    description: "Iconic Los Angeles landmark captured on film",
    imageUrl: FilmGriffith,
    dateCreated: "2017-04-18",
  },
].sort(
  (a, b) =>
    new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
);

// Rest of the component remains the same as in the previous optimization
const FilterButton = React.memo(
  ({
    medium,
    currentFilter,
    onClick,
  }: {
    medium: Medium;
    currentFilter: Medium;
    onClick: (medium: Medium) => void;
  }) => (
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
  )
);

FilterButton.displayName = "FilterButton";

const ArtworkCard = React.memo(
  ({
    artwork,
    index,
    isVisible,
    onClick,
  }: {
    artwork: Artwork;
    index: number;
    isVisible: boolean;
    onClick: (index: number) => void;
  }) => (
    <div
      onClick={() => isVisible && onClick(index)}
      className={`
      group relative aspect-square rounded-xl overflow-hidden backdrop-blur-xs
      transition-opacity duration-300 transform
      ${isVisible ? "opacity-100" : "hidden"}
    `}
    >
      <img
        src={artwork.imageUrl}
        alt={artwork.title}
        loading="lazy"
        className="object-cover w-full h-full transition-all duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <div className="font-josefin text-white">
          <h3 className="font-semibold">{artwork.title}</h3>
          <p className="text-sm text-purple-200">{artwork.medium}</p>
        </div>
      </div>
    </div>
  )
);

ArtworkCard.displayName = "ArtworkCard";

const Art: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentFilter, setCurrentFilter] = useState<Medium>("All");

  const visibleArtworks = React.useMemo(
    () =>
      artworks.filter(
        (artwork) => currentFilter === "All" || artwork.medium === currentFilter
      ),
    [currentFilter]
  );

  const handleNext = useCallback(() => {
    setSelectedImage((prev) => {
      if (prev === null) return null;
      const currentVisibleIndex = visibleArtworks.findIndex(
        (artwork) => artwork === artworks[prev]
      );
      return artworks.indexOf(
        visibleArtworks[
          currentVisibleIndex === visibleArtworks.length - 1
            ? 0
            : currentVisibleIndex + 1
        ]
      );
    });
  }, [visibleArtworks]);

  const handlePrevious = useCallback(() => {
    setSelectedImage((prev) => {
      if (prev === null) return null;
      const currentVisibleIndex = visibleArtworks.findIndex(
        (artwork) => artwork === artworks[prev]
      );
      return artworks.indexOf(
        visibleArtworks[
          currentVisibleIndex === 0
            ? visibleArtworks.length - 1
            : currentVisibleIndex - 1
        ]
      );
    });
  }, [visibleArtworks]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === "ArrowLeft") handlePrevious();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") setSelectedImage(null);
    },
    [selectedImage, handlePrevious, handleNext]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const filterButtons = React.useMemo(
    () =>
      [
        "All",
        "Painting",
        "Film Photography",
        "Digital Photography",
        "Wood",
      ].map((medium) => (
        <FilterButton
          key={medium}
          medium={medium as Medium}
          currentFilter={currentFilter}
          onClick={setCurrentFilter}
        />
      )),
    [currentFilter]
  );

  return (
    <motion.div {...pageTransition}>
      <div className="space-y-8">
        <div>
          <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 inline-flex items-center backdrop-blur-xs">
            Art Gallery
            <Palette className="text-pink-500 ml-2 mt-[-4px]" size={20} />
          </h2>

          <div className="flex flex-wrap gap-2">{filterButtons}</div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {artworks.map((artwork, index) => (
            <ArtworkCard
              key={artwork.imageUrl}
              artwork={artwork}
              index={index}
              isVisible={
                currentFilter === "All" || artwork.medium === currentFilter
              }
              onClick={setSelectedImage}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage !== null && (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
                <div className="text-white">Loading...</div>
              </div>
            }
          >
            <Lightbox
              artwork={artworks[selectedImage]}
              onClose={() => setSelectedImage(null)}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Art;
