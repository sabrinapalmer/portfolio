import React from "react";
import { motion } from "framer-motion";
import { SquareCode, Blocks } from "lucide-react";
import { pageTransition } from "../utils/animation";

const experiences = [
  {
    role: "Data Projects Engineer, SE Strategy & Operations",
    company: "Splunk",
    location: "Remote, Chicago, IL",
    period: "November 2022 - January 2024",
    achievements: [
      "Spearheaded analytics initiatives from ideation through implementation, ensuring alignment between stakeholder needs and technical solutions",
      "Maintained critical data pipelines processing 50,000+ events/hour, ensuring reliable data flow from diverse sources",
      "Developed comprehensive team performance dashboard, enabling data-driven management decisions through role-based views and expertise tracking",
      "Built Google Drive analytics dashboard which correlated document engagement with sales outcomes, driving targeted improvements in sales enablement materials",
      "Partnered with directors to identify key metrics and create executive-level dashboards for strategic decision-making",
    ],
    technologies: [
      "React.js",
      "SPL",
      "Splunk",
      "Data Analytics",
      "Dashboard Development",
      "Technical Documentation",
      "API Integration",
      "CI/CD",
      "ETL",
      "Project Management",
    ],
  },
  {
    role: "Data Analytics Developer, SE Strategy & Operations",
    company: "Splunk",
    location: "Remote, Chicago, IL",
    period: "February 2020 - November 2022",
    achievements: [
      "Rapidly learned React.js to debug and maintain mission-critical sales activity logging application on day one",
      "Cut Sales Engineer logging time by 50% through streamlined form inputs and Google Calendar integration",
      "Maintained and enhanced existing dashboards based on user feedback and changing business needs",
    ],
    technologies: [
      "React.js",
      "SPL",
      "Splunk",
      "Data Analytics",
      "Dashboard Development",
      "Technical Documentation",
      "API Integration",
    ],
  },
  {
    role: "Sales Engineer",
    company: "Splunk",
    location: "Dallas, TX",
    period: "February 2019 - February 2020",
    achievements: [
      "Built and presented AI-driven data exploration project (Splunking Blackjack below) at .conf19 in Las Vegas, demonstrating live model training capabilities of Splunk's Machine Learning Toolkit (MLTK)",
      "Spoke at Baylor University Women in STEM panel about industry experiences, inspiring female students to pursue tech careers",
      "Delivered technical demonstrations to customer executives, showcasing data management and analysis solutions",
    ],
    technologies: [
      "Machine Learning",
      "Technical Presentations",
      "Solution Architecture",
    ],
  },
  {
    role: "Sales Engineer Intern",
    company: "Splunk",
    location: "Dallas, TX",
    period: "June 2018 - February 2019",
    achievements: [
      "Achieved Splunk Certified Administrator certification",
      "Co-built and presented an IoT data visualization project with full-time Engineers at .conf18 in Orlando, FL",
    ],
    technologies: [
      "Splunk",
      "IoT",
      "Data Visualization",
      "Technical Presentations",
      "Technical Sales",
      "Solution Architecture",
    ],
  },
];

const projects = [
  {
    title: "Splunking Blackjack - Splunk .conf19",
    description:
      "Built and presented an innovative machine learning system at Splunk's annual conference, demonstrating the live model training capabilities of Splunk's Machine Learning Toolkit (MLTK). The project showcased practical applications of AI in data exploration and analysis.",
    technologies: [
      "Machine Learning",
      "Splunk",
      "Splunk MLTK",
      "OpenCV",
      "Real-time Processing",
      "Data Analytics",
    ],
    impact:
      "Successfully demonstrated advanced ML capabilities to conference attendees and showcased practical applications of Splunk's MLTK",
  },
  {
    title: "Splunking Ping Pong - Splunk .conf18",
    description:
      "Co-developed an innovative IoT system that captured and visualized real-time data. Presented the project at Splunk's annual conference, demonstrating practical applications of IoT data collection and analysis.",
    technologies: [
      "IoT",
      "Data Visualization",
      "Computer Vision",
      "GPU Programming",
      "iOS Development",
      "Real-time Analytics",
      "Splunk",
    ],
    impact:
      "Effectively showcased IoT capabilities and real-time data processing at conference",
  },
  {
    title: "Women in STEM Panel Speaker - Baylor University",
    description:
      "Featured speaker at Baylor University's Women in STEM panel, sharing insights on technology careers and personal industry experiences. Focused on inspiring female students to pursue careers in technology and providing practical advice for success in the field.",
    impact:
      "Contributed to promoting diversity in tech and inspiring the next generation of women in STEM",
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
