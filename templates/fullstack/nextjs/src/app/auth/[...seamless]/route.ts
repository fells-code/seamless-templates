import {
  createSeamlessAuthHandler,
  type SeamlessAuthRouteHandlers,
} from "@seamless-auth/nextjs";

import { requireAuthConfig } from "@/lib/config";

// The Seamless Auth routes the browser SDK calls, served by this application.
// Built on the first request rather than at import, because `next build`
// imports this module and the build has no secrets to read.
let handlers: SeamlessAuthRouteHandlers | undefined;

function seamless(): SeamlessAuthRouteHandlers {
  handlers ??= createSeamlessAuthHandler(requireAuthConfig().handler);
  return handlers;
}

export const GET = (request: Request) => seamless().GET(request);
export const POST = (request: Request) => seamless().POST(request);
export const PATCH = (request: Request) => seamless().PATCH(request);
export const DELETE = (request: Request) => seamless().DELETE(request);
