import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

// Next.js boots every page from inline scripts, and a static config cannot hand
// out per-request nonces, so script-src admits inline scripts but no other
// origin. next dev also needs eval for its error overlay and stack traces.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // A self-contained server bundle, so the Dockerfile ships no node_modules.
  output: "standalone",
  // Pinned to this directory. Next.js otherwise looks for the outermost
  // lockfile, and inside a repository of several projects that nests the
  // standalone server under the wrong path.
  outputFileTracingRoot: import.meta.dirname,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
