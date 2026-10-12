/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F5F8",
        ink: "#24212B",
        muted: "#69656F",
        line: "#E1DEE6",
        plum: {
          DEFAULT: "#5E3A8C",
          dark: "#4A2D70",
          wash: "#EEE9F4",
        },
        film: "#1E1B22",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        sans: ['"Instrument Sans Variable"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "72rem",
        prose: "38rem",
      },
    },
  },
  plugins: [],
};
