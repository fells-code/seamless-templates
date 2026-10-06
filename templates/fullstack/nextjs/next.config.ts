import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server bundle, so the Dockerfile ships no node_modules.
  output: "standalone",
  // Pinned to this directory. Next.js otherwise looks for the outermost
  // lockfile, and inside a repository of several projects that nests the
  // standalone server under the wrong path.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
