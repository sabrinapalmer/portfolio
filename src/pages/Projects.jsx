import React, { useState } from "react";
import { motion } from "framer-motion";
import { Code, Globe, Github } from "lucide-react";

const Projects = () => {
  const [filter, setFilter] = useState("all");

  const projects = [
    {
      title: "Project 1",
      description: "A brief description of project 1 and its key features",
      tags: ["React", "Node.js", "MongoDB"],
      type: "web",
      image: "/api/placeholder/400/250",
      links: {
        live: "https://project1.com",
        github: "https://github.com/username/project1",
      },
    },
    // Add more projects as needed
  ];

  return (
    <motion.div
      className="p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2
        className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 
                     bg-clip-text text-transparent mb-8"
        style={{ fontFamily: "Josefin Sans, sans-serif", fontWeight: 700 }}
      >
        Projects
      </h2>

      {/* Project Filters */}
      <div className="flex gap-4 mb-8">
        {["all", "web", "mobile", "games"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full transition-all duration-300 ${
              filter === type
                ? "bg-gradient-to-r from-purple-200 to-pink-200 text-purple-700 shadow-md"
                : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-gray-600"
            }`}
            style={{ fontFamily: "Josefin Sans, sans-serif" }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-48 object-cover rounded-t-xl"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-purple-600 mb-2">
                {project.title}
              </h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Globe size={18} />
                  <span>Live Demo</span>
                </a>
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Github size={18} />
                  <span>Source Code</span>
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Projects;
