import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  {
    ignores: ["node_modules", ".next", "dist", "build", "coverage", ".turbo", ".vercel", "public"],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.jsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react
    },
    rules: {
      "no-console": "off",
      "react/react-in-jsx-scope": "off",
      "no-empty": "off",
      "no-unused-vars": "off",
      "no-undef": "off"
    },
    settings: {
      react: { version: "detect" }
    }
  }
];
