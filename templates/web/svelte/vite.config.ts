import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      // A single-page app: the session lives in the browser, and nginx serves
      // index.html for every route the build did not write.
      adapter: adapter({ fallback: "index.html" }),
    }),
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
