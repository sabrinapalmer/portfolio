import React from "react";

interface ScrimProps {
  children: React.ReactNode;
  className?: string;
}

const Scrim: React.FC<ScrimProps> = ({ children, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Optimized backdrop blur layers */}
      <div className="absolute inset-[-30px] rounded-[30px] opacity-20 backdrop-blur-md" />
      <div className="absolute inset-[-10px] rounded-[25px] opacity-40 backdrop-blur-sm" />
      <div className="absolute inset-0 rounded-[20px] opacity-80 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
};

export default Scrim;
