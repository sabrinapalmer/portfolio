import { SquareCode, Gamepad2, Palette, Mail } from "lucide-react";

export const navItems = [
  {
    path: "experience",
    name: "Experience",
    icon: SquareCode,
    description: "Professional software experience and technical projects",
    gradient: "from-purple-400 to-pink-400",
  },
  {
    path: "projects",
    name: "Projects",
    icon: Gamepad2,
    description: "Websites, apps, free tools and games",
    gradient: "from-pink-400 to-purple-400",
  },
  {
    path: "art",
    name: "Art",
    icon: Palette,
    description: "Film photography and booking a shoot",
    gradient: "from-purple-400 to-pink-400",
  },
  {
    path: "contact",
    name: "Contact",
    icon: Mail,
    description: "Get in touch with me 💌",
    gradient: "from-pink-400 to-purple-400",
  },
] as const;
