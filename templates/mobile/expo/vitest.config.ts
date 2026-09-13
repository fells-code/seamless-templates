import { defineConfig } from "vitest/config";

// Covers the pure modules under src/. Screens are React Native and are
// exercised on a simulator, not here.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: { include: ["src/**/*.ts"], exclude: ["src/**/*.test.ts"] },
  },
});
