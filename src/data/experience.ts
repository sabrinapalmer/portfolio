export interface Role {
  title: string;
  team?: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface Employer {
  company: string;
  summary: string;
  roles: Role[];
  skills: string[];
}

export interface Talk {
  title: string;
  venue: string;
  year: string;
  description: string;
  skills?: string[];
}

export const employers: Employer[] = [
  {
    company: "Splunk",
    summary:
      "Started as a sales engineering intern and moved into building internal data tools and dashboards for the sales engineering organization.",
    roles: [
      {
        title: "Data Projects Engineer",
        team: "SE Strategy & Operations",
        location: "Remote, Chicago, IL",
        start: "Nov 2022",
        end: "Jan 2024",
        highlights: [
          "Led analytics projects from scoping with stakeholders through implementation.",
          "Maintained data pipelines processing more than 50,000 events per hour from many sources.",
          "Built a team performance dashboard with role-based views and expertise tracking, so managers could make decisions from data.",
          "Built a Google Drive analytics dashboard that tied document engagement to sales outcomes, which guided updates to sales enablement material.",
          "Worked with directors to define key metrics and build executive dashboards.",
        ],
      },
      {
        title: "Data Analytics Developer",
        team: "SE Strategy & Operations",
        location: "Remote, Chicago, IL",
        start: "Feb 2020",
        end: "Nov 2022",
        highlights: [
          "Picked up React on day one to debug and maintain the mission-critical sales activity logging app.",
          "Cut the time Sales Engineers spent logging activity by 50% by simplifying form inputs and adding Google Calendar integration.",
          "Maintained and extended dashboards as user feedback and business needs changed.",
        ],
      },
      {
        title: "Sales Engineer",
        location: "Dallas, TX",
        start: "Feb 2019",
        end: "Feb 2020",
        highlights: [
          "Built and presented Splunking Blackjack at .conf19, a live demo of model training with the Machine Learning Toolkit.",
          "Ran technical demos of data management and analysis solutions for customer executives.",
        ],
      },
      {
        title: "Sales Engineer Intern",
        location: "Dallas, TX",
        start: "Jun 2018",
        end: "Feb 2019",
        highlights: [
          "Earned the Splunk Certified Administrator certification.",
          "Co-built and presented an IoT data visualization project at .conf18.",
        ],
      },
    ],
    skills: [
      "React",
      "SPL",
      "Splunk",
      "Dashboards",
      "ETL and data pipelines",
      "API integration",
      "CI/CD",
      "Machine Learning Toolkit",
      "Technical documentation",
      "Project management",
    ],
  },
];

export const talks: Talk[] = [
  {
    title: "Splunking Blackjack",
    venue: "Splunk .conf19, Las Vegas",
    year: "2019",
    description:
      "A machine learning demo built around blackjack that trained a model live on stage with Splunk's Machine Learning Toolkit.",
    skills: ["Splunk MLTK", "OpenCV", "Machine learning", "Real-time processing"],
  },
  {
    title: "Splunking Ping Pong",
    venue: "Splunk .conf18, Orlando",
    year: "2018",
    description:
      "Co-developed an IoT system that captured ping pong game data and visualized it in real time.",
    skills: ["IoT", "Computer vision", "iOS", "Real-time analytics"],
  },
  {
    title: "Women in STEM panel",
    venue: "Baylor University",
    year: "2019",
    description:
      "Panel speaker on working in tech, with practical advice for students heading into technical careers.",
  },
];
