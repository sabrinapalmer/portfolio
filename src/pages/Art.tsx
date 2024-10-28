import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette } from "lucide-react";
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

  const filteredArtworks = artworks.filter(
    (artwork) => currentFilter === "All" || artwork.medium === currentFilter
  );

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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="font-josefin absolute top-4 right-4 text-white hover:text-purple-300 transition-colors"
            >
              <X size={24} />
            </button>
            <div>
              <div
                className="max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={filteredArtworks[selectedImage].imageUrl}
                  alt={filteredArtworks[selectedImage].title}
                  className="w-full h-auto rounded-xl"
                />
                <div className="font-josefin text-white mt-4">
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
