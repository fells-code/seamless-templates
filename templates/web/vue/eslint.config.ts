import pluginVitest from "@vitest/eslint-plugin";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import skipFormatting from "eslint-config-prettier/flat";
import pluginVue from "eslint-plugin-vue";
import { globalIgnores } from "eslint/config";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{vue,ts,mts,tsx}"],
  },

  globalIgnores(["**/dist/**", "**/coverage/**"]),

  ...pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/*.test.ts"],
  },

  // Last, so formatting rules that would fight Prettier are switched off.
  skipFormatting,
);
