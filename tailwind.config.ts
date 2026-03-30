import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "rm-bg": "#0a0a0a",
        "rm-card": "#141414",
        "rm-border": "#222222",
        "rm-text": "#f5f5f5",
        "rm-muted": "#666666",
        "rm-accent": "#e91e8c",
      },
    },
  },
  plugins: [],
};
export default config;
