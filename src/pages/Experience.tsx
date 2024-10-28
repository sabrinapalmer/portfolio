import React from "react";
import { motion } from "framer-motion";
import { SquareCode, Blocks } from "lucide-react";
import { pageTransition } from "../utils/animation";

const experiences = [
  {
    role: "Data Projects Engineer",
    company: "Splunk",
    location: "Remote, Chicago, IL",
    period: "February 2020 - January 2024",
    achievements: [
      "Promoted after 2 years for taking on full scale projects from end to end",
      "Developed competitive analysis dashboard that increased win rates by improving visibility of successful sales strategies",
      "Built and maintained critical data pipelines processing 50,000+ events per hour from diverse sources",
      "Integrated Google Calendar and Salesforce API into React web app, eliminating manual event logging for sales engineers and cutting their logging time by 50%",
      "Participated in global executive sales strategy meetings, providing ad-hoc reports and dashboard demonstrations",
    ],
    technologies: [
      "Data Visualization",
      "Dashboard Development",
      "Business Analytics",
      "SPL",
      "React",
      "Splunk",
      "UI/UX Design",
      "API Integration",
      "CI/CD",
    ],
  },
  {
    role: "Sales Engineer",
    company: "Splunk",
    location: "Dallas, TX",
    period: "February 2019 - February 2020",
    achievements: [
      "Collaborated with customers to understand their data management needs and tailored custom demonstrations",
      "Demonstrated time and cost-saving strategies through Splunk tool implementations",
      "Worked closely with Splunk and partner engineers to provide continuous customer support",
      "Built strong relationships with key stakeholders and technical teams",
    ],
    technologies: [
      "Splunk",
      "Technical Sales",
      "Solution Architecture",
      "Data Management",
    ],
  },
];

const projects = [
  {
    title: "Splunking Blackjack at Splunk .conf19",
    description:
      "Designed and engineered an interactive machine learning system that allowed conference attendees to play blackjack against an AI opponent. The system uniquely incorporated live gameplay data to continuously train and improve the ML algorithm, creating an engaging demonstration of practical machine learning applications.",
    technologies: [
      "Machine Learning",
      "Real-time Processing",
      "Python",
      "Splunk ML Toolkit",
    ],
    impact:
      "Successfully engaged conference attendees with hands-on ML demonstration and live training data collection",
  },
  {
    title: "Splunking Ping Pong at Splunk .conf18",
    description:
      "Built an innovative IoT system featuring a custom iPhone application utilizing GPU programming for real-time ball tracking. The system calculated ball position and height by analyzing the ball's apparent size in the camera feed, creating an interactive data visualization experience.",
    technologies: [
      "IoT",
      "Computer Vision",
      "GPU Programming",
      "iOS Development",
      "Real-time Analytics",
      "Splunk",
    ],
    impact:
      "Demonstrated practical applications of computer vision and real-time data processing",
  },
  {
    title: "Women in Technology Panel Speaker - Baylor University",
    description:
      "Served as a featured speaker at Baylor University's Women in Technology panel, sharing insights on software engineering careers and inspiring the next generation of women in tech. Discussed challenges, opportunities, and strategies for success in the technology industry.",
    impact:
      "Motivated students and contributed to advancing women's representation in technology",
  },
];

const Experience = () => {
  return (
    <motion.div {...pageTransition}>
      <div className="space-y-8">
        {/* Professional Experience Section */}
        <section>
          <div>
            <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 inline-flex items-center backdrop-blur-xs">
              Professional Experience
              <SquareCode className="text-pink-500 ml-2 mt-[-4px]" size={20} />
            </h2>
          </div>

          <div className="grid gap-8">
            {experiences.map((experience, index) => (
              <div
                key={index}
                className="font-josefin p-6 rounded-2xl bg-white/90 shadow-md border border-purple-100 hover:shadow-lg transition-shadow backdrop-blur-xs"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div>
                    <h3 className="font-josefin text-xl font-semibold text-purple-500">
                      {experience.role}
                    </h3>
                    <p className="font-josefin text-sm text-pink-400">
                      {experience.company} • {experience.location}
                    </p>
                  </div>
                  <p className="font-josefin text-sm text-gray-500 mt-1 md:mt-0">
                    {experience.period}
                  </p>
                </div>
                <ul className="font-josefin space-y-2 text-gray-600 mb-4">
                  {experience.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start">
                      <span className="font-josefin text-purple-500 mr-2">
                        •
                      </span>
                      {achievement}
                    </li>
                  ))}
                </ul>
                <div className="font-josefin flex flex-wrap gap-2">
                  {experience.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="font-josefin px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-500"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section className="mt-12">
          <div>
            <h2 className="font-josefin text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-8 inline-flex items-center backdrop-blur-xs">
              Professional Projects & Speaking
              <Blocks className="text-pink-500 ml-2 mt-[-4px]" size={20} />
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {projects.map((project, index) => (
              <div
                key={index}
                className="font-josefin p-6 rounded-2xl bg-white/90 shadow-md border border-purple-100 hover:shadow-lg transition-shadow backdrop-blur-xs"
              >
                <h3 className="font-josefin text-xl font-semibold text-purple-500 mb-2">
                  {project.title}
                </h3>
                <p className="font-josefin text-gray-600 mb-4">
                  {project.description}
                </p>
                {project.technologies && (
                  <div className="font-josefin flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="font-josefin px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <p className="font-josefin text-sm text-pink-400">
                  {project.impact}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default Experience;
