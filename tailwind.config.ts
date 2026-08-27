import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#14110e",
          900: "#1c1917",
          800: "#292524",
          700: "#44403c",
          600: "#57534e",
        },
        paper: {
          50: "#fbf8f1",
          100: "#f4efe4",
          200: "#e8dfcc",
        },
        copper: {
          50: "#faf4ec",
          100: "#f3e4ce",
          200: "#e4c49a",
          300: "#d4a066",
          400: "#c4843f",
          500: "#b87333",
          600: "#9a5a24",
          700: "#7c451c",
        },
        ledger: {
          500: "#0f766e",
          600: "#0d5f59",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 25, 23, 0.06), 0 8px 24px rgba(28, 25, 23, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
