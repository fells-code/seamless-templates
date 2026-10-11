import eslint from "@eslint/js";
import angular from "angular-eslint";
import prettier from "eslint-config-prettier/flat";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default tseslint.config(
  globalIgnores(["dist", "coverage", ".angular", "public/config.js"]),
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended,
      // Last, so formatting rules that would fight Prettier are switched off.
      prettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
  },
);
