export interface Project {
  title: string;
  description: string;
  tags: string[];
  type: "web" | "mobile" | "games";
  image: string;
  links: {
    demo: any;
    live?: string;
    github?: string;
  };
}

export interface Artwork {
  title: string;
  category: string;
  description: string;
  image: string;
}
