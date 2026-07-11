/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          bg: "#050914",
          panel: "#0b1224",
          line: "#1c2540",
          accent: "#ff5b1f",
          accent2: "#ffb020",
          neon: "#22d3ee",
          lime: "#a3e635",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(255,91,31,0.55)",
        neon: "0 0 30px -6px rgba(34,211,238,0.65)",
      },
      backgroundImage: {
        "court-grad":
          "radial-gradient(80% 60% at 50% 0%, rgba(255,91,31,0.18) 0%, rgba(5,9,20,0) 60%), radial-gradient(60% 40% at 100% 100%, rgba(34,211,238,0.15) 0%, rgba(5,9,20,0) 60%)",
        "grid-lines":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
    },
  },
  plugins: [],
};
