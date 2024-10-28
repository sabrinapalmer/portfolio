import React from "react";
import { motion } from "framer-motion";
import { Star, Heart, Sparkles, Moon, Cloud, Rainbow } from "lucide-react";
import FloatingIcon from "../components/common/FloatingIcon";

const Home: React.FC = () => {
  const backgroundElements = [
    { Icon: Star, delay: 0, speed: 0.5, color: "text-purple-300" },
    { Icon: Heart, delay: 1, speed: 0.5, color: "text-pink-300" },
    { Icon: Sparkles, delay: 2, speed: 0.5, color: "text-purple-200" },
    { Icon: Moon, delay: 0, speed: 0.5, color: "text-purple-300" },
    { Icon: Cloud, delay: 1, speed: 0.5, color: "text-pink-300" },
    { Icon: Rainbow, delay: 2, speed: 0.5, color: "text-purple-200" },
  ];

  return (
    <div className="h-full w-full flex items-center justify-center px-6 md:px-12">
      <div className="fixed inset-0 pointer-events-none">
        {backgroundElements.slice(0, 6).map((element, index) => (
          <FloatingIcon key={index} {...element} />
        ))}
      </div>
      <div>
        {/* Profile Content */}
        <div className="text-center space-y-4 md:space-y-6">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-md transform group-hover:scale-110 transition-transform"></div>
            <img
              src="/api/placeholder/150/150"
              alt="Profile"
              className="relative w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full border-4 border-white shadow-lg transform transition-transform group-hover:scale-105"
            />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-2 shadow-lg">
              <Sparkles className="text-purple-500" size={16} />
            </div>
          </div>

          <div>
            <h1 className="font-chango text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Hi, I'm Sabrina! ✨
            </h1>
            <h2 className="font-josefin text-xl md:text-2xl mt-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Software Engineer & Creative Artist
            </h2>
          </div>

          <p className="font-josefin text-sm md:text-base bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Building beautiful things with code and creativity 💫
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
