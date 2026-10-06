import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Last, so formatting rules that would fight Prettier are switched off.
  prettier,
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts"]),
]);
