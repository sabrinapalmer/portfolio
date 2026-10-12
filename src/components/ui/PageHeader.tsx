import React from "react";
import { BouncyText } from "./Motion";
import { Squiggle } from "./Doodle";

interface PageHeaderProps {
  title: string;
  intro?: React.ReactNode;
  color?: string;
  art?: React.ReactNode;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  intro,
  color = "#FF5FA8",
  art,
  children,
}) => (
  <header className="relative pb-12 pt-12 sm:pt-16">
    {art && (
      <div className="pointer-events-none absolute right-0 top-8 hidden animate-bob sm:block">
        {art}
      </div>
    )}
    <h1 className="text-5xl font-extrabold sm:text-7xl">
      <BouncyText text={title} />
    </h1>
    <Squiggle className="mt-2 h-4 w-44" color={color} />
    {intro && <p className="mt-5 max-w-prose text-lg sm:text-xl">{intro}</p>}
    {children}
  </header>
);

export default PageHeader;
