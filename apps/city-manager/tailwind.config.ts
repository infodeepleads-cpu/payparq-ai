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
        sidebar: "#FFFFFF", // Changed from F9F9F9 to pure white
        sidebarText: "#000000", // Changed from 4B5563 to black
        sidebarHover: "#5A45E81A", // Very light purple (10% opacity)
        background: "#FFFFFF", // Pure white main bg
        surface: "#FFFFFF",
        border: "#0000000D", // 5% black border instead of gray
        text: {
          primary: "#000000",
          secondary: "#00000099", // 60% black text
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
