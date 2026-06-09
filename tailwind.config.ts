import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Registre finance / pédagogie : bleu nuit sobre + accent ardoise.
        ink: {
          DEFAULT: "#0f172a",
          soft: "#1e293b",
        },
        accent: {
          DEFAULT: "#1d4ed8",
          soft: "#3b82f6",
        },
        paper: "#f8fafc",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
