import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aselco: {
          blue: "#0D47A1",
          light: "#E3F2FD",
          gold: "#FFB300",
          dark: "#0F172A",
        },
        gcash: {
          blue: "#005CE6",
          bg: "#E6F0FF",
        },
        maya: {
          green: "#00A300",
          bg: "#E6F7E6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
