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
        bg: "#EEECE6",
        background: "#EEECE6",
        primary: {
          DEFAULT: "#2C4A2E",
          50: "#E8EFE9",
          100: "#C5D6CA",
          200: "#9EBAA7",
          300: "#779E84",
          400: "#4D7D60",
          500: "#2C4A2E",
          600: "#163025",
          700: "#11261D",
          800: "#0C1C15",
          900: "#07120D",
        },
        accent: {
          DEFAULT: "#1B2E4B",
          light: "#FAF9F6",
        },
        muted: "#6B7B5E",
        surface: "#F5F3EE",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "serif"],
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};
export default config;
