// `seamless check` and the conformance harness wait on /health. nginx answers it
// in the production image; this answers it on `vite dev`, which, unlike a plain
// Vite app, returns 404 for a path with no route.
export const prerender = true;

export function GET() {
  return new Response("ok");
}
