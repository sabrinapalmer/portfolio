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
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "marquee-slow": "marquee 60s linear infinite",
        bob: "bob 4s ease-in-out infinite",
        "spin-slow": "spin 14s linear infinite",
      },
    },
  },
  plugins: [],
};
