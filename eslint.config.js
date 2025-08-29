// @ts-check

import nextPlugin from "@next/eslint-plugin-next";

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];

export default config;
