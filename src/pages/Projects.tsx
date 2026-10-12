import React from "react";
import PageHeader from "../components/ui/PageHeader";
import ProjectCard from "../components/ui/ProjectCard";
import Doodle from "../components/ui/Doodle";
import { PopIn } from "../components/ui/Motion";
import {
  accentBg,
  accentSoft,
  inTheWorks,
  projectGroups,
  projects,
} from "../data/projects";

const Projects: React.FC = () => (
  <div className="page">
    <PageHeader
      title="Projects"
      color="#2FD0A0"
      intro="Websites, apps and tools I've built, games from game jams, and what I'm working on next. Newest first."
      art={<Doodle name="sparkle" className="h-36 w-36" />}
    >
      <nav aria-label="Project types" className="mt-7 flex flex-wrap gap-3">
        {projectGroups.map((g) => (
          <a key={g.type} href={`#${g.type}`} className={`btn !py-1.5 ${accentBg[g.accent]}`}>
            {g.title}
          </a>
        ))}
        <a href="#in-the-works" className="btn !py-1.5 bg-white">
          In the works
        </a>
      </nav>
    </PageHeader>

    {projectGroups.map((group) => {
      const items = projects
        .filter((p) => p.type === group.type)
        .sort((a, b) => b.date.localeCompare(a.date));
      return (
        <section key={group.type} id={group.type} className="scroll-mt-24 pt-10">
          <div className="flex items-center gap-3">
            <span className={`h-5 w-5 rounded-full border-2 border-ink ${accentBg[group.accent]}`} aria-hidden />
            <h2 className="section-title">{group.title}</h2>
          </div>
          <p className="mt-1 text-muted">{group.intro}</p>
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <PopIn key={p.title} delay={(i % 3) * 0.08}>
                <ProjectCard project={p} tilt={[-1.2, 0.8, -0.6][i % 3]} />
              </PopIn>
            ))}
          </div>
        </section>
      );
    })}

    <section id="in-the-works" className="scroll-mt-24 pt-16">
      <h2 className="section-title">In the works</h2>
      <p className="mt-1 text-muted">Not public yet, coming along.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {inTheWorks.map((w, i) => (
          <PopIn key={w.title} rotate={i % 2 ? 1.5 : -1.5}>
            <div className={`sticker flex items-center gap-5 p-5 ${accentSoft[w.accent]}`}>
              <Doodle name={w.doodle} className="h-20 w-20 shrink-0" />
              <div>
                <h3 className="text-xl font-bold">{w.title}</h3>
                <p className="mt-1 text-[15px]">{w.summary}</p>
              </div>
            </div>
          </PopIn>
        ))}
      </div>
    </section>
  </div>
);

export default Projects;
