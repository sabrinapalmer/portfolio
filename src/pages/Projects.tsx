import React from "react";
import PageHeader from "../components/ui/PageHeader";
import { Project, formatMonth, projectGroups, projects } from "../data/projects";

const isExternal = (url: string) => url.startsWith("http");

const ProjectRow: React.FC<{ project: Project }> = ({ project }) => (
  <li className="grid gap-5 border-t border-line py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10">
    <div className="aspect-[16/10] overflow-hidden rounded-md border border-line bg-white">
      {project.image ? (
        <img
          src={project.image}
          alt={`Screenshot of ${project.title}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-end bg-plum-wash p-5">
          <span className="font-display text-3xl font-semibold text-plum">
            {project.title}
          </span>
        </div>
      )}
    </div>

    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-2xl font-semibold">{project.title}</h3>
        <p className="text-[15px] text-muted">{formatMonth(project.date)}</p>
      </div>
      <p className="mt-2 max-w-prose text-lg">{project.summary}</p>
      {project.details && (
        <p className="mt-2 max-w-prose text-muted">{project.details}</p>
      )}
      <ul className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((t) => (
          <li key={t} className="tag">
            {t}
          </li>
        ))}
      </ul>
      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
        {project.links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              className="link"
              {...(isExternal(l.url)
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </li>
);

const Projects: React.FC = () => (
  <div className="page">
    <PageHeader
      title="Projects"
      intro="Websites, apps and tools I've built, and games from game jams. Newest first."
    >
      <nav aria-label="Project types" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
        {projectGroups.map((g) => (
          <a key={g.type} href={`#${g.type}`} className="link">
            {g.title}
          </a>
        ))}
      </nav>
    </PageHeader>

    {projectGroups.map((group) => (
      <section key={group.type} id={group.type} className="scroll-mt-20 pt-6">
        <h2 className="section-title">{group.title}</h2>
        <p className="mt-1 text-muted">{group.intro}</p>
        <ul className="mt-6">
          {projects
            .filter((p) => p.type === group.type)
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((p) => (
              <ProjectRow key={p.title} project={p} />
            ))}
        </ul>
      </section>
    ))}
  </div>
);

export default Projects;
