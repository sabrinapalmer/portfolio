/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF6FF",
        ink: "#2B1840",
        muted: "#6E5F80",
        line: "#E6DCF2",
        grape: { DEFAULT: "#7C4DFF", dark: "#5B2FE0", soft: "#E9E0FF" },
        gum: { DEFAULT: "#FF5FA8", soft: "#FFE0EF" },
        tang: { DEFAULT: "#FF9A3C", soft: "#FFE9D4" },
        butter: { DEFAULT: "#FFD43B", soft: "#FFF4C7" },
        mint: { DEFAULT: "#2FD0A0", soft: "#D5F7EC" },
        sky: { DEFAULT: "#4DB8FF", soft: "#DDF1FF" },
        film: "#22152F",
      },
      fontFamily: {
        display: ['"Gluten Variable"', "ui-rounded", "system-ui", "sans-serif"],
        sans: ['"Instrument Sans Variable"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "74rem",
        prose: "38rem",
      },
      boxShadow: {
        sticker: "4px 4px 0 0 #2B1840",
        "sticker-lg": "7px 7px 0 0 #2B1840",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
        "drift-1": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(10px, -16px) rotate(10deg)" },
          "66%": { transform: "translate(-8px, -6px) rotate(-8deg)" },
        },
        "drift-2": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(-12px, 14px) rotate(-12deg)" },
        },
        "drift-3": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(18px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-6deg)" },
          "75%": { transform: "rotate(6deg)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "marquee-slow": "marquee 60s linear infinite",
        bob: "bob 4s ease-in-out infinite",
        "spin-slow": "spin 14s linear infinite",
        "drift-1": "drift-1 11s ease-in-out infinite",
        "drift-2": "drift-2 13s ease-in-out infinite",
        "drift-3": "drift-3 16s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
};
