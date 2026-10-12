import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Doodle from "./Doodle";
import {
  Project,
  accentBg,
  accentSoft,
  formatMonth,
} from "../../data/projects";

const isExternal = (url: string) => url.startsWith("http");

const ProjectCard: React.FC<{
  project: Project;
  tilt?: number;
  compact?: boolean;
}> = ({ project, tilt = 0, compact }) => {
  const reduce = useReducedMotion();
  return (
    <motion.article
      className="sticker flex h-full flex-col overflow-hidden"
      style={{ rotate: reduce ? 0 : tilt }}
      whileHover={reduce ? undefined : { rotate: 0, y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
    >
      <div
        className={`relative flex items-center justify-center border-b-2 border-ink ${
          project.image ? "aspect-[16/9]" : compact ? "h-36" : "h-44"
        } ${accentSoft[project.accent]}`}
      >
        {project.image ? (
          <img
            src={project.image}
            alt={`Screenshot of ${project.title}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : project.doodle ? (
          <Doodle
            name={project.doodle}
            className={`${compact ? "h-24 w-24" : "h-32 w-32"} animate-bob`}
          />
        ) : null}
        <span
          className={`absolute left-3 top-3 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold text-ink ${accentBg[project.accent]}`}
        >
          {formatMonth(project.date)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-2xl font-bold">{project.title}</h3>
        <p className="mt-2">{project.summary}</p>
        {!compact && project.details && (
          <p className="mt-2 text-[15px] text-muted">{project.details}</p>
        )}
        {!compact && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {project.links.map((l, i) => (
            <a
              key={l.url}
              href={l.url}
              className={`btn !py-1.5 !text-sm ${
                i === 0 ? accentBg[project.accent] : "bg-white"
              }`}
              {...(isExternal(l.url)
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;
