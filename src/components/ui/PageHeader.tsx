import React from "react";

interface PageHeaderProps {
  title: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, intro, children }) => (
  <header className="pb-10 pt-14 sm:pt-20">
    <h1 className="font-display text-4xl font-semibold sm:text-5xl">{title}</h1>
    {intro && <p className="mt-4 max-w-prose text-lg text-muted">{intro}</p>}
    {children}
  </header>
);

export default PageHeader;
