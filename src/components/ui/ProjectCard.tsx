import React from "react";
import SiteCover from "./SiteCover";
import Doodle from "./Doodle";
import { Project, accentBg, accentSoft, formatMonth } from "../../data/projects";

const isExternal = (url: string) => url.startsWith("http");

/* Every card has the same 16:10 picture area that is always filled:
   a screenshot, an illustrated site preview, or a doodle on color. */
const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <article className="sticker group flex h-full flex-col overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-1.5 hover:shadow-sticker-lg">
    <div
      className={`relative aspect-[16/10] overflow-hidden border-b-2 border-ink ${accentSoft[project.accent]}`}
    >
      {project.image ? (
        <img
          src={project.image}
          alt={`Screenshot of ${project.title}`}
          loading="lazy"
          width={960}
          height={600}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : project.cover ? (
        <SiteCover
          name={project.cover}
          title={project.title}
          className="absolute inset-0 h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : project.doodle ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Doodle name={project.doodle} className="h-1/2 w-1/2 animate-bob" />
        </div>
      ) : null}
      {project.doodle && (project.image || project.cover) && (
        <span
          className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink shadow-[2px_2px_0_0_#2B1840] transition-transform duration-300 group-hover:scale-110 ${accentSoft[project.accent]}`}
          aria-hidden
        >
          <Doodle name={project.doodle} className="h-8 w-8" />
        </span>
      )}
    </div>

    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-2xl font-bold">{project.title}</h3>
        <span
          className={`mt-1 shrink-0 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold text-ink ${accentBg[project.accent]}`}
        >
          {formatMonth(project.date)}
        </span>
      </div>
      <p className="mt-2">{project.summary}</p>
      {project.details && (
        <p className="mt-2 text-[15px] text-muted">{project.details}</p>
      )}
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <li key={t} className="chip">
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {project.links.map((l, i) => (
          <a
            key={l.url}
            href={l.url}
            className={`btn !py-1.5 !text-sm ${i === 0 ? accentBg[project.accent] : "bg-white"}`}
            {...(isExternal(l.url)
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {l.label}
            {isExternal(l.url) && <span aria-hidden>↗</span>}
          </a>
        ))}
      </div>
    </div>
  </article>
);

export default ProjectCard;
