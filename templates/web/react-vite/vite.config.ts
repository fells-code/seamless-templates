/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      // Tailwind's Vite plugin has no work to do in a test run, and skipping CSS
      // keeps component tests off the styling pipeline entirely.
      css: false,
    },
  };
});
