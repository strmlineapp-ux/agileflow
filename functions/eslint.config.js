// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "quotes": ["error", "double"],
      "indent": ["error", 2],
      "no-prototype-builtins": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Best practices for modern JS modules
      "import/no-unresolved": 0,
      "import/named": 2,
      "import/namespace": 2,
      "import/default": 2,
      "import/export": 2,
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    ignores: ["lib/", "generated/"],
  }
);
