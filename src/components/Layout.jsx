import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Scrim from "./Scrim";
import FloatingIcon from "./FloatingIcon";
import {
  Code,
  Laptop,
  ImageIcon,
  Mail,
  Star,
  Heart,
  Sparkles,
} from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(null);

  useEffect(() => {
    const path = location.pathname.substring(1);
    if (path && path !== "/") {
      setSelectedTab(path);
    } else {
      setSelectedTab(null);
    }
  }, [location]);

  const tabs = [
    { path: "experience", name: "Experience", icon: <Code size={24} /> },
    { path: "projects", name: "Projects", icon: <Laptop size={24} /> },
    { path: "art", name: "Art", icon: <ImageIcon size={24} /> },
    { path: "contact", name: "Contact", icon: <Mail size={24} /> },
  ];

  const floatingIcons = [
    { Icon: Star, delay: 0, speed: 2, color: "text-purple-300", size: 40 },
    { Icon: Heart, delay: 1, speed: 1.5, color: "text-pink-300", size: 30 },
    {
      Icon: Sparkles,
      delay: 2,
      speed: 2.5,
      color: "text-purple-200",
      size: 40,
    },
    { Icon: Star, delay: 3, speed: 1.8, color: "text-pink-200", size: 30 },
    { Icon: Heart, delay: 4, speed: 2.2, color: "text-purple-300", size: 40 },
    { Icon: Sparkles, delay: 5, speed: 1.7, color: "text-pink-300", size: 30 },
  ];

  const handleTabClick = (tab) => {
    setSelectedTab(tab.path);
    navigate(`/${tab.path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 relative overflow-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Chango&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap');
        `}
      </style>

      {/* Background with floating icons */}
      <div className="fixed inset-0 pointer-events-none">
        {floatingIcons.map((icon, index) => (
          <FloatingIcon key={index} {...icon} />
        ))}
      </div>

      {/* Navigation Header */}
      <AnimatePresence>
        {selectedTab && (
          <motion.div
            className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-20"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between px-8 h-full">
              <motion.button
                onClick={() => navigate("/")}
                className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 
                         bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontFamily: "Chango, sans-serif" }}
              >
                Sabrina Palmer
              </motion.button>
              <div className="flex gap-6">
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.path}
                    layoutId={`tab-${tab.path}`}
                    onClick={() => handleTabClick(tab)}
                    className={`group flex items-center space-x-2 px-4 py-2 rounded-full
                      transition-all duration-300 ${
                        selectedTab === tab.path
                          ? "bg-gradient-to-r from-purple-200 to-pink-200 text-purple-700 shadow-md"
                          : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50"
                      }`}
                    style={{ fontFamily: "Josefin Sans, sans-serif" }}
                  >
                    <span
                      className={`text-lg transition-all duration-300
                      ${
                        selectedTab === tab.path
                          ? "text-purple-700 font-semibold"
                          : "text-gray-600 group-hover:text-purple-600"
                      }`}
                    >
                      {tab.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="h-screen flex">
        {/* Left Section */}
        {!selectedTab && (
          <motion.div
            className="w-1/2 flex flex-col justify-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="pl-16 pr-8 text-center">
              <Scrim className="flex items-center justify-center">
                <h1
                  className="text-5xl mb-6 leading-tight bg-gradient-to-r from-purple-400 to-pink-400 
                            bg-clip-text text-transparent"
                  style={{ fontFamily: "Chango, sans-serif" }}
                >
                  Hi, I'm Sabrina!
                </h1>
                <h1
                  className="text-5xl mb-6 leading-tight bg-gradient-to-r from-purple-400 to-pink-400 
                            bg-clip-text text-transparent"
                  style={{ fontFamily: "Chango, sans-serif" }}
                >
                  ✨
                </h1>
                <h2
                  className="text-2xl mb-3 leading-tight bg-gradient-to-r from-purple-400 to-pink-400 
                            bg-clip-text text-transparent"
                  style={{
                    fontFamily: "Josefin Sans, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Software Engineer & Creative Artist
                </h2>
                <p
                  className="text-xl leading-tight bg-gradient-to-r from-purple-400 to-pink-400 
                            bg-clip-text text-transparent"
                  style={{
                    fontFamily: "Josefin Sans, sans-serif",
                    fontWeight: 400,
                  }}
                >
                  Making beautiful things with code and creativity
                </p>
              </Scrim>
            </div>
          </motion.div>
        )}

        {/* Right Section */}
        <motion.div
          className="relative"
          animate={{
            width: selectedTab ? "100%" : "50%",
          }}
          transition={{ duration: 0.5 }}
        >
          {!selectedTab ? (
            // Home state tabs
            <div className="h-full bg-white p-8">
              <div className="flex flex-col space-y-6 justify-center h-full items-center">
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.path}
                    layoutId={`tab-${tab.path}`}
                    onClick={() => handleTabClick(tab)}
                    className="group flex items-center space-x-3 px-6 py-3 rounded-full
                      transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50"
                    style={{ fontFamily: "Josefin Sans, sans-serif" }}
                  >
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      {tab.icon}
                    </div>
                    <span className="text-xl text-gray-600 group-hover:text-purple-600">
                      {tab.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            // Selected tab content
            <div className="min-h-screen pt-16">
              <div className="container mx-auto p-8">
                <Outlet />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Layout;
