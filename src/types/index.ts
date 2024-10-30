export interface Project {
  title: string;
  description: string;
  tags: string[];
  type: "web" | "games";
  image: string;
  date: string;
  links: {
    demo?: string; // Made optional
    github?: string;
    extra?: {
      label: string;
      url: string;
    };
  };
}

export interface Artwork {
  title: string;
  category: string;
  description: string;
  image: string;
}
