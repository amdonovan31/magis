import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F5ED",
        primary: {
          DEFAULT: "#1B3A2D",
          50: "#E8EFE9",
          100: "#C5D6CA",
          200: "#9EBAA7",
          300: "#779E84",
          400: "#4D7D60",
          500: "#1B3A2D",
          600: "#163025",
          700: "#11261D",
          800: "#0C1C15",
          900: "#07120D",
        },
        accent: {
          DEFAULT: "#B8960C",
          50: "#FBF3D0",
          100: "#F5E39E",
          200: "#EDD06A",
          300: "#E4BD38",
          400: "#D8AA1A",
          500: "#B8960C",
          600: "#967A0A",
          700: "#735E07",
          800: "#504205",
          900: "#2E2602",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};
export default config;
