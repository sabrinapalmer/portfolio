import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { pageTransition } from "../utils/animation";
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
import FilmSunsetSticks from "../assets/art/film_sunsetsticks.jpg";

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

const artworks: Artwork[] = [
  {
    title: "Sticks at Sunset, Moonrise",
    medium: "Film Photography",
    description: "Moon, sticks, and their shadows, captured at sunset on film",
    imageUrl: FilmSunsetSticks,
    dateCreated: "2024-09-15",
  },
  {
    title: "Smile Tower",
    medium: "Film Photography",
    description: "Water tower with a big smile, captured on film",
    imageUrl: FilmSmileTower,
    dateCreated: "2024-07-22",
  },
  {
    title: "Rock Building",
    medium: "Film Photography",
    description: "Building build out of the rocks, captured on film",
    imageUrl: FilmRockBuilding,
    dateCreated: "2024-05-10",
  },
  {
    title: "Moiré Pattern",
    medium: "Film Photography",
    description: "Moiré Pattern occurring in a shadow, captured on film",
    imageUrl: FilmMoirePattern,
    dateCreated: "2024-03-18",
  },
  {
    title: "Film Burn at Fire Station",
    medium: "Film Photography",
    description:
      "Film Burn (first of the roll - https://www.instagram.com/f1rstoftheroll) at the Lincoln Fire Station - with a phone booth on the roof",
    imageUrl: FilmFire,
    dateCreated: "2024-1-15",
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
    dateCreated: "2023-06-24",
  },
  {
    title: "Baháʼí in the Fog",
    medium: "Film Photography",
    description: "Baháʼí on a foggy day, captured on film",
    imageUrl: FilmBhai,
    dateCreated: "2023-04-12",
  },
  {
    title: "Landscape on Film",
    medium: "Film Photography",
    description: "Natural landscape study",
    imageUrl: FilmLandscape1,
    dateCreated: "2023-02-28",
  },
  {
    title: "Landscape Series II",
    medium: "Film Photography",
    description: "Continuing exploration of natural landscapes",
    imageUrl: FilmLandscape2,
    dateCreated: "2022-11-15",
  },
  {
    title: "Landscape Series III",
    medium: "Film Photography",
    description: "Third in the landscape series",
    imageUrl: FilmLandscape3,
    dateCreated: "2022-09-20",
  },
  {
    title: "Landscape Series IV",
    medium: "Film Photography",
    description: "Fourth in the landscape series",
    imageUrl: FilmLandscape4,
    dateCreated: "2022-07-05",
  },
  {
    title: "Griffith Observatory on Film",
    medium: "Film Photography",
    description: "Iconic Los Angeles landmark captured on film",
    imageUrl: FilmGriffith,
    dateCreated: "2022-04-18",
  },
  {
    title: "Flowers on Film",
    medium: "Film Photography",
    description: "Bright flowers captured on film",
    imageUrl: FilmFlowers,
    dateCreated: "2018-08-30",
  },
  {
    title: "Building on Film",
    medium: "Film Photography",
    description: "Architectural study",
    imageUrl: FilmBuilding,
    dateCreated: "2021-03-15",
  },
  {
    title: "Recycled Wood Coffee Table",
    medium: "Wood",
    description: "Coffee table made from old bed frame.",
    imageUrl: CoffeeTable,
    dateCreated: "2022-04-10",
  },
];

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
const Art: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentFilter, setCurrentFilter] = useState<Medium>("All");

  // Get only visible artworks for lightbox navigation
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

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === "ArrowLeft") handlePrevious();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") setSelectedImage(null);
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
            {[
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
            ))}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {artworks.map((artwork, index) => {
            const isVisible =
              currentFilter === "All" || artwork.medium === currentFilter;

            return (
              <div
                key={artwork.imageUrl}
                onClick={() => isVisible && setSelectedImage(index)}
                className={`
                  group relative aspect-square rounded-xl overflow-hidden backdrop-blur-xs
                  transition-opacity duration-300 transform
                  ${isVisible ? "opacity-100" : "hidden"}
                `}
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
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="fixed top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors md:block hidden"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
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
                      key={selectedImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      src={artworks[selectedImage].imageUrl}
                      alt={artworks[selectedImage].title}
                      className="h-full w-auto max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
                <div
                  className="font-josefin text-white mt-4 mb-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-josefin text-xl font-semibold">
                    {artworks[selectedImage].title}
                  </h3>
                  <p className="font-josefin text-purple-300 capitalize">
                    {artworks[selectedImage].medium}
                  </p>
                  <p className="font-josefin mt-2 text-gray-300">
                    {artworks[selectedImage].description}
                  </p>
                  <p className="font-josefin mt-2 text-gray-400 text-sm">
                    {new Date(
                      artworks[selectedImage].dateCreated
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
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
