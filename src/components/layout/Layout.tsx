import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navigation from "./Navigation";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 relative overflow-x-hidden">
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
        <div className="flex min-h-screen">
          <div className="w-1/2">
            <Outlet />
          </div>

          <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
            {!pendingPath && (
              <motion.div
                key="home-nav"
                className="fixed right-0 top-0 bottom-0 w-1/2 bg-white"
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
        <div className="min-h-screen pt-20">
          <div className="container mx-auto px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }} // Faster page content fade in
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
