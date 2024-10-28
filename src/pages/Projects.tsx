import React, { useState } from "react";
import { motion } from "framer-motion";
import { Code, Globe, Github, Gamepad2 } from "lucide-react";
import { Project } from "../types";
import { pageTransition } from "../utils/animation";

const projects: Project[] = [
  {
    title: "Creative Coding Experiment",
    description: "Interactive art piece using generative algorithms",
    tags: ["p5.js", "TypeScript", "WebGL"],
    type: "web",
    image: "/api/placeholder/400/300",
    links: {
      github: "#",
      demo: "#",
    },
  },
  // Add more projects as needed
];

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<"all" | Project["type"]>("all");

  const filteredProjects = projects.filter(
    (project) => filter === "all" || project.type === filter
  );

  return (
    <motion.div {...pageTransition}>
      <div className="space-y-8">
        <div>
          <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 inline-flex items-center backdrop-blur-xs">
            Creative Projects
            <Gamepad2 className="text-pink-500 ml-2 mt-[-4px]" size={20} />
          </h2>

          <div className="flex flex-wrap gap-2">
            {["all", "web", "mobile", "games"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as typeof filter)}
                className={`px-4 py-2 rounded-full transition-all duration-300 backdrop-blur-xs ${
                  filter === type
                    ? "font-josefin bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-md"
                    : "font-josefin bg-white/90 text-gray-600 hover:text-purple-500 hover:bg-purple-50"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <motion.div
    className="bg-white/90 rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-shadow backdrop-blur-xs"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <img
      src={project.image}
      alt={project.title}
      className="w-full h-48 object-cover rounded-t-xl"
    />
    <div className="p-6">
      <h3 className="font-josefin text-xl font-semibold text-purple-500 mb-2">
        {project.title}
      </h3>
      <p className="font-josefin text-gray-600 mb-4">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="font-josefin px-3 py-1 bg-purple-100 text-purple-500 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex gap-4">
        {project.links.demo && (
          <a
            href={project.links.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="font-josefin flex items-center gap-2 text-purple-500 hover:text-purple-700"
          >
            <Globe size={18} />
            <span>Live Demo</span>
          </a>
        )}
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-josefin flex items-center gap-2 text-purple-500 hover:text-purple-700"
          >
            <Github size={18} />
            <span>Source Code</span>
          </a>
        )}
      </div>
    </div>
  </motion.div>
);

export default Projects;
