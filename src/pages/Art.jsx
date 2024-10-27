import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const Art = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const artworks = [
    {
      title: "Artwork 1",
      category: "Digital",
      description: "Description of artwork 1",
      image: "/api/placeholder/400/400",
    },
    // Add more artworks as needed
  ];

  return (
    <motion.div
      className="p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2
        className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 
                     bg-clip-text text-transparent mb-8"
        style={{ fontFamily: "Josefin Sans, sans-serif", fontWeight: 700 }}
      >
        Art Gallery
      </h2>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {artworks.map((artwork, index) => (
          <motion.div
            key={index}
            className="relative group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedImage(artwork)}
          >
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-64 object-cover rounded-xl shadow-md transition-all duration-300
                       group-hover:shadow-xl"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-purple-900/70 to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                          rounded-xl flex items-end p-4"
            >
              <div className="text-white">
                <h3 className="text-lg font-semibold">{artwork.title}</h3>
                <p className="text-sm text-purple-100">{artwork.category}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full bg-white rounded-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedImage(null)}
              >
                <X size={24} />
              </button>
              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="w-full h-auto rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold text-purple-600 mb-2">
                {selectedImage.title}
              </h3>
              <p className="text-gray-600">{selectedImage.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Art;
