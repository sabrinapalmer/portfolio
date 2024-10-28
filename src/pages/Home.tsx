import React from "react";
import { motion } from "framer-motion";
import { Heart, Star, Sparkles } from "lucide-react";
import Scrim from "../components/layout/Scrim";

const Home: React.FC = () => {
  const decorativeIcons = [
    { Icon: Star, className: "top-20 left-10 animate-float-1" },
    { Icon: Heart, className: "bottom-20 right-10 animate-float-2" },
    { Icon: Sparkles, className: "top-40 right-20 animate-float-3" },
    { Icon: Star, className: "bottom-40 left-20 animate-float-4" },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center px-12">
      <Scrim>
        {/* Profile Content */}
        <div className="text-center space-y-6">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-md transform group-hover:scale-110 transition-transform"></div>
            <img
              src="/api/placeholder/150/150"
              alt="Profile"
              className="relative w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg transform transition-transform group-hover:scale-105"
            />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-2 shadow-lg">
              <Sparkles className="text-purple-500" size={20} />
            </div>
          </div>

          <div>
            <h1 className="font-chango text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Hi, I'm Sabrina! ✨
            </h1>
            <h2 className="font-josefin text-2xl mt-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Software Engineer & Creative Artist
            </h2>
          </div>

          <p className="font-josefin bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Building beautiful things with code and creativity 💫
          </p>
        </div>
      </Scrim>
    </div>
  );
};

export default Home;
