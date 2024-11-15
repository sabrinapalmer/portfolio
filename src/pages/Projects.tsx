import React, { useState } from "react";
import { motion } from "framer-motion";
import { Code, Globe, Github, Gamepad2, Calendar } from "lucide-react";
import { Project } from "../types";
import { pageTransition } from "../utils/animation";
import Stonemoth from "../assets/projects/Stonemoth.png";
import Flawp from "../assets/projects/Flawp.png";
import WaywardWarlock from "../assets/projects/WaywardWarlock.png";
import SpotifyCustomizer from "../assets/projects/SpotifyCustomizer.png";
import Portfolio from "../assets/projects/Portfolio.png";

const formatDescription = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
};

const projects: Project[] = [
  {
    title: "Personal Portfolio",
    description:
      "A modern, responsive portfolio website built to showcase my projects and skills. Features smooth animations " +
      "and a clean, minimalist design that adapts seamlessly across all devices.",
    tags: ["React", "Tailwind CSS", "Vite", "Vercel", "TypeScript"],
    type: "web",
    image: Portfolio,
    date: "2024-10-15",
    links: {
      demo: "https://sabrinapalmer.com",
      github: "https://github.com/sabrinapalmer/portfolio",
    },
  },
  {
    title: "Stonemoth",
    description:
      'Created for Ludum Dare Game Jam 56 with the theme "Tiny Creatures". Working alongside ' +
      '<a href="https://bradjste.com" target="_blank" rel="noopener noreferrer" class="text-purple-500 hover:text-purple-700">Brad Stevenson</a>, ' +
      "we built this game in just 72 hours. Out of nearly 2000 submissions, we achieved notable rankings: **94th** in Innovation and " +
      "**168th** in Theme.",
    tags: ["Unity", "C#", "Game Jam"],
    type: "games",
    image: Stonemoth,
    date: "2024-10-07",
    links: {
      demo: "https://bradjste.itch.io/stonemoth",
      github: "https://github.com/sabrinapalmer/STONEMOTH",
      extra: {
        label: "Game Jam Page",
        url: "https://ldjam.com/events/ludum-dare/56/ld56-game",
      },
    },
  },
  {
    title: "Spotify Playlist Customizer",
    description:
      "A web application that enhances the Spotify playlist experience by allowing users to create custom playlist " +
      "covers that reflect the songs in their playlist. Users can also reorganize their playlists based on various song features, " +
      "providing a new way to experience their music collections. Currently in development mode - email me to request access and try it out!",
    tags: ["React", "Node.js", "Spotify API"],
    type: "web",
    image: SpotifyCustomizer,
    date: "2024-10-01",
    links: {
      demo: "https://playlistcustomizer.sabrinapalmer.com/",
      github: "https://github.com/sabrinapalmer/spotify-playlist-analyzer",
    },
  },
  {
    title: "Flawp",
    description:
      'Developed for the Game Maker\'s Toolkit Game Jam 2022 with the theme "Roll of the Dice". ' +
      'Created in collaboration with <a href="https://bradjste.com" target="_blank" rel="noopener noreferrer" class="text-purple-500 hover:text-purple-700">Brad Stevenson</a>. ' +
      "Out of over 6000 entries, we achieved rankings of **792nd** in Creativity, **1251st** in Presentation, and **1042nd** Overall.",
    tags: ["Unity", "C#", "Game Jam"],
    type: "games",
    image: Flawp,
    date: "2022-07-17",
    links: {
      demo: "https://bradjste.itch.io/flawp",
      extra: {
        label: "Game Jam Page",
        url: "https://itch.io/jam/gmtk-jam-2022/rate/1625103",
      },
    },
  },
  {
    title: "Wayward Warlock",
    description:
      'Created for Ludum Dare Game Jam 49 with the theme "Unstable". ' +
      "As part of a team of four talented developers, we crafted this game competing against almost 3000 submissions. " +
      "While we faced strong competition, we gained valuable experience working as a larger team in the game jam environment.",
    tags: ["Unity", "C#", "Game Jam"],
    type: "games",
    image: WaywardWarlock,
    date: "2021-10-04",
    links: {
      github: "https://github.com/sabrinapalmer/WaywardWarlock",
      extra: {
        label: "Game Jam Page",
        url: "https://ldjam.com/events/ludum-dare/49/wayward-warlock",
      },
    },
  },
];

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<"all" | Project["type"]>("all");

  const filteredProjects = projects
    .filter((project) => filter === "all" || project.type === filter)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <motion.div {...pageTransition}>
      <div className="space-y-8">
        <div>
          <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 inline-flex items-center backdrop-blur-xs">
            Creative Projects
            <Gamepad2 className="text-pink-500 ml-2 mt-[-4px]" size={20} />
          </h2>

          <div className="flex flex-wrap gap-2">
            {["all", "web", "games"].map((type) => (
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
      <div className="flex justify-between items-start mb-2">
        <a
          href={project.links.extra?.url || project.links.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="font-josefin text-xl font-semibold text-purple-500 hover:text-purple-700"
        >
          {project.title}
        </a>
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar size={14} className="mr-1" />
          {new Date(project.date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
      <p
        className="font-josefin text-gray-600 mb-4"
        dangerouslySetInnerHTML={{
          __html: formatDescription(project.description),
        }}
      />
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
        {project.links.extra && (
          <a
            href={project.links.extra.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-josefin flex items-center gap-2 text-purple-500 hover:text-purple-700"
          >
            <Code size={18} />
            <span>{project.links.extra.label}</span>
          </a>
        )}
      </div>
    </div>
  </motion.div>
);

export default Projects;
