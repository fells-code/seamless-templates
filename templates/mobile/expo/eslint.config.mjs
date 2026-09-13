import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";
import { globalIgnores } from "eslint/config";

export default tseslint.config([
  globalIgnores([
    "dist",
    "coverage",
    ".expo",
    "ios",
    "android",
    "expo-env.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      // Last, so formatting rules that would fight Prettier are switched off.
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node, __DEV__: "readonly" },
    },
  },
]);
