import React from "react";
import { motion } from "framer-motion";
import { navItems } from "../../config/navigation";

interface NavigationProps {
  currentPage: string;
  isHome: boolean;
  onNavigate: (path: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  isHome,
  onNavigate,
}) => {
  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (path === currentPage && !isHome) return;
    onNavigate(path);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHome) return;
    onNavigate("");
  };

  // Container variants for staggered children animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  // Item variants for individual nav items
  const itemVariants = {
    hidden: {
      opacity: 0,
      x: 50, // Start slightly to the right
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  if (isHome) {
    return (
      <motion.div
        className="h-full flex flex-col justify-center items-stretch px-12 py-12 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => (
          <motion.button
            key={item.path}
            variants={itemVariants}
            onClick={(e) => handleNavigation(e, item.path)}
            className="w-full relative"
            whileHover={{ opacity: 0.9 }}
            whileTap={{ opacity: 0.8 }}
          >
            <div
              className={`relative bg-gradient-to-r ${item.gradient} p-6 rounded-xl shadow-md hover:shadow-lg 
                            transition-all duration-300 overflow-hidden`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <item.icon size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-josefin text-xl font-semibold text-white">
                    {item.name}
                  </h3>
                  <p className="font-josefin text-sm text-white/90 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between h-16 items-center">
        <motion.button
          onClick={handleHomeClick}
          className="font-chango text-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
          whileHover={{ opacity: 0.8 }}
          whileTap={{ opacity: 0.7 }}
          transition={{ duration: 0.2 }}
        >
          Sabrina Palmer ✨
        </motion.button>

        <div className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <motion.button
              key={item.path}
              layoutId={`tab-${item.path}`}
              onClick={(e) => handleNavigation(e, item.path)}
              className="group relative"
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`px-4 py-2 rounded-full relative overflow-hidden ${
                  currentPage === item.path
                    ? `bg-gradient-to-r ${item.gradient} shadow-md`
                    : "hover:bg-purple-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <item.icon
                    size={24}
                    className={
                      currentPage === item.path
                        ? "text-white"
                        : "text-purple-500"
                    }
                  />
                  <span
                    className={`font-josefin ${
                      currentPage === item.path
                        ? "text-white"
                        : "text-purple-500"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
