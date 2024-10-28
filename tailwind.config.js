/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "float-1": "float1 20s ease-in-out infinite",
        "float-2": "float2 23s ease-in-out infinite",
        "float-3": "float3 25s ease-in-out infinite",
        "float-4": "float4 22s ease-in-out infinite",
      },
      keyframes: {
        float1: {
          "0%, 100%": { transform: "translate(0px, 0px) rotate(0deg)" },
          "25%": { transform: "translate(10px, 10px) rotate(5deg)" },
          "50%": { transform: "translate(0px, 20px) rotate(0deg)" },
          "75%": { transform: "translate(-10px, 10px) rotate(-5deg)" },
        },
        float2: {
          "0%, 100%": { transform: "translate(0px, 0px) rotate(0deg)" },
          "25%": { transform: "translate(-15px, 15px) rotate(-5deg)" },
          "50%": { transform: "translate(0px, 25px) rotate(0deg)" },
          "75%": { transform: "translate(15px, 15px) rotate(5deg)" },
        },
        float3: {
          "0%, 100%": { transform: "translate(0px, 0px) rotate(0deg)" },
          "25%": { transform: "translate(15px, -15px) rotate(5deg)" },
          "50%": { transform: "translate(0px, -25px) rotate(0deg)" },
          "75%": { transform: "translate(-15px, -15px) rotate(-5deg)" },
        },
        float4: {
          "0%, 100%": { transform: "translate(0px, 0px) rotate(0deg)" },
          "25%": { transform: "translate(-10px, -10px) rotate(-5deg)" },
          "50%": { transform: "translate(0px, -20px) rotate(0deg)" },
          "75%": { transform: "translate(10px, -10px) rotate(5deg)" },
        },
      },
    },
  },
  plugins: [],
};
