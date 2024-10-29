import React from "react";
import { Sparkles } from "lucide-react";
import Profile from "../assets/profile.png";

const Home: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 md:px-12 overflow-hidden">
      <div className="max-h-full">
        <div className="text-center space-y-4 md:space-y-6">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-md transform group-hover:scale-110 transition-transform"></div>
            <img
              src={Profile}
              alt="Profile"
              className="object-contain relative w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full border-4 border-white shadow-lg transform transition-transform group-hover:scale-105 backdrop-blur-xs select-none pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
              data-pin-nopin="true"
              draggable="false"
              loading="lazy"
            />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-2 shadow-lg">
              <Sparkles className="text-purple-500" size={16} />
            </div>
          </div>
          <div className="backdrop-blur-xs">
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
    </div>
  );
};

export default Home;
