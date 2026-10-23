import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navigation from "./Navigation";
import { Star, Heart, Sparkles, Moon, Cloud, Rainbow } from "lucide-react";
import FloatingIcon from "../common/FloatingIcon";

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<string>("");
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const isHome = location.pathname === "/";

  useEffect(() => {
    const path = location.pathname.substring(1);
    setCurrentPage(path || "home");
  }, [location]);

  const backgroundElements = [
    { Icon: Star, delay: 0, speed: 0.5, color: "text-purple-300" },
    { Icon: Heart, delay: 1, speed: 0.5, color: "text-pink-300" },
    { Icon: Sparkles, delay: 2, speed: 0.5, color: "text-purple-200" },
    { Icon: Moon, delay: 0, speed: 0.5, color: "text-purple-300" },
    { Icon: Cloud, delay: 1, speed: 0.5, color: "text-pink-300" },
    { Icon: Rainbow, delay: 2, speed: 0.5, color: "text-purple-200" },
    { Icon: Star, delay: 0, speed: 0.5, color: "text-purple-300" },
    { Icon: Heart, delay: 1, speed: 0.5, color: "text-pink-300" },
    { Icon: Sparkles, delay: 2, speed: 0.5, color: "text-purple-200" },
    { Icon: Moon, delay: 0, speed: 0.5, color: "text-purple-300" },
    { Icon: Cloud, delay: 1, speed: 0.5, color: "text-pink-300" },
    { Icon: Rainbow, delay: 2, speed: 0.5, color: "text-purple-200" },
  ];

  const handleNavigation = useCallback(
    (path: string) => {
      if (isHome) {
        setPendingPath(path);
      } else {
        navigate(path);
      }
    },
    [isHome, navigate]
  );

  const handleExitComplete = useCallback(() => {
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  }, [pendingPath, navigate]);

  const topNavTransition = {
    type: "spring",
    stiffness: 260,
    damping: 20,
    duration: 0.2, // Slightly faster
  };

  const sideNavTransition = {
    type: "tween",
    duration: 0.3, // Reduced from 0.5 to 0.3
    ease: [0.25, 0.1, 0.25, 1], // Modified easing for a snappier feel
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        {backgroundElements.map((element, index) => (
          <FloatingIcon key={index} {...element} />
        ))}
      </div>

      <AnimatePresence>
        {!isHome && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={topNavTransition}
          >
            <div className="bg-white shadow-sm">
              <Navigation
                currentPage={currentPage}
                isHome={false}
                onNavigate={handleNavigation}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isHome ? (
        <div className="fixed inset-0 flex flex-col md:flex-row">
          <div className="fixed top-0 left-0 right-0 md:relative md:w-1/2 h-[45vh] md:h-full overflow-hidden">
            <Outlet />
          </div>

          <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
            {!pendingPath && (
              <motion.div
                key="home-nav"
                className="fixed bottom-0 left-0 right-0 h-[45vh] md:h-full md:relative md:w-1/2 bg-white rounded-t-3xl md:rounded-none shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)] md:shadow-none overflow-hidden"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={sideNavTransition}
              >
                <Navigation
                  currentPage={currentPage}
                  isHome={true}
                  onNavigate={handleNavigation}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="pt-20 h-full overflow-auto">
          <div className="container mx-auto px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
