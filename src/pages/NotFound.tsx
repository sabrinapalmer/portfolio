import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const NotFound: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center px-6">
    <div className="text-center space-y-4 backdrop-blur-xs">
      <h1 className="font-chango text-5xl md:text-7xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
        404
      </h1>
      <p className="font-josefin text-lg text-gray-600">
        This page wandered off.
      </p>
      <Link
        to="/"
        className="font-josefin inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-md hover:shadow-lg transition-shadow"
      >
        <Sparkles size={16} />
        Back home
      </Link>
    </div>
  </div>
);

export default NotFound;
