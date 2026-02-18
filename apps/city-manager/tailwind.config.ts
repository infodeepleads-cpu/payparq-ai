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
        primary: "#000000",
        sidebar: "#F9F9F9", // Light gray like screenshot
        sidebarText: "#4B5563", // Dark gray text
        sidebarHover: "#E5E7EB", // Light gray hover
        background: "#FFFFFF", // Pure white main bg
        surface: "#FFFFFF",
        border: "#E5E7EB",
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          onDark: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'system-ui',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'pill': '0 2px 12px rgba(0,0,0,0.08)', // Soft shadow for input pill
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
export default config;
