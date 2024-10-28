import React from "react";

interface PageHeaderProps {
  title: string;
  emoji?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, emoji }) => (
  <div className="relative">
    <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
      {title} {emoji}
    </h2>
    <div className="font-josefin absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
  </div>
);

export default PageHeader;
