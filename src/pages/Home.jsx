import React from "react";
import { motion } from "framer-motion";
import { Code, Laptop, Mail } from "lucide-react";

const Home = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center md:text-left">
        {/* Project Preview Cards */}
        <div className="grid grid-cols-1 gap-6 px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl 
                     hover:shadow-lg transition-all duration-300 cursor-pointer
                     group relative overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 
                          scale-x-0 group-hover:scale-x-100 transition-transform 
                          duration-500 origin-left"
            />
            <h3 className="text-xl font-semibold text-purple-600 mb-2 relative z-10">
              Latest Project
            </h3>
            <p className="text-gray-600 relative z-10">
              Check out my most recent work in software development.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl 
                     hover:shadow-lg transition-all duration-300 cursor-pointer
                     group relative overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 
                          scale-x-0 group-hover:scale-x-100 transition-transform 
                          duration-500 origin-left"
            />
            <h3 className="text-xl font-semibold text-purple-600 mb-2 relative z-10">
              Featured Artwork
            </h3>
            <p className="text-gray-600 relative z-10">
              Explore my creative artworks and designs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl 
                     hover:shadow-lg transition-all duration-300 cursor-pointer
                     group relative overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 
                          scale-x-0 group-hover:scale-x-100 transition-transform 
                          duration-500 origin-left"
            />
            <h3 className="text-xl font-semibold text-purple-600 mb-2 relative z-10">
              Get in Touch
            </h3>
            <p className="text-gray-600 relative z-10">
              Have a project in mind? Let's work together!
            </p>
          </motion.div>
        </div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center md:justify-start gap-4 mt-8 px-8"
        >
          {/* Social icons with hover effects */}
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 
                     hover:from-purple-200 hover:to-pink-200 transition-all duration-300
                     text-purple-600 hover:text-purple-700"
          >
            <Code size={20} />
          </a>
          <a
            href="https://linkedin.com/in/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 
                     hover:from-purple-200 hover:to-pink-200 transition-all duration-300
                     text-purple-600 hover:text-purple-700"
          >
            <Laptop size={20} />
          </a>
          <a
            href="mailto:your.email@example.com"
            className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 
                     hover:from-purple-200 hover:to-pink-200 transition-all duration-300
                     text-purple-600 hover:text-purple-700"
          >
            <Mail size={20} />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
