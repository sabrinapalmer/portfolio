import React from "react";
import { quickLinks } from "../../config/links";

// Pill links to the sites and tools. `className` controls layout per placement.
const QuickLinks: React.FC<{ className?: string }> = ({ className = "" }) => (
  <nav aria-label="Quick links" className={className}>
    {quickLinks.map((link) => {
      const external = link.url.startsWith("http");
      return (
        <a
          key={link.name}
          href={link.url}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="shrink-0 font-josefin text-xs md:text-sm px-3 py-1 rounded-full bg-white/80 text-purple-500 border border-purple-200 shadow-sm hover:bg-white hover:text-pink-500 hover:-translate-y-0.5 transition-all backdrop-blur-xs whitespace-nowrap"
        >
          {link.name}
        </a>
      );
    })}
  </nav>
);

export default QuickLinks;
