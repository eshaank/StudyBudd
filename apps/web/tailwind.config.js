// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          dark: "#4f46e5",
        },
        accent: {
          DEFAULT: "#06b6d4",
          light: "#22d3ee",
        },
      },
      animation: {
        typing:
          "typing var(--dur,3s) steps(var(--steps), end) var(--delay,0s) both, caret .75s step-end infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        gradient: "gradient-shift 8s ease infinite",
        shimmer: "shimmer 2s linear infinite",
        blob: "blob 8s ease-in-out infinite",
      },
      keyframes: {
        typing: {
          "0%": { width: "0ch" },
          "100%": { width: "var(--nch)" },
        },
        caret: {
          "0%,100%": { borderRightColor: "transparent" },
          "50%": { borderRightColor: "#6366f1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(2deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blob: {
          "0%, 100%": {
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          },
          "50%": {
            borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6, 182, 212, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(139, 92, 246, 0.2) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};
