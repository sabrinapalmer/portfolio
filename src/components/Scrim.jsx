import React from "react";

const Scrim = ({ children, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Reduced number of blur layers and optimized blur values */}
      <div className="absolute inset-[-20px] rounded-[30px] opacity-20 backdrop-blur-md will-change-transform" />
      <div className="absolute inset-[-10px] rounded-[25px] opacity-30 backdrop-blur-sm will-change-transform" />

      {/* Main content backdrop with reduced blur */}
      <div className="absolute inset-0 rounded-[20px] opacity-70 backdrop-blur-[2px] will-change-transform" />

      {/* Content container */}
      <div className="relative">{children}</div>
    </div>
  );
};
export default Scrim;
