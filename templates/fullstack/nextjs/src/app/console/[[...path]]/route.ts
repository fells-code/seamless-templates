import {
  createSeamlessConsoleProxy,
  type SeamlessConsoleProxyHandlers,
} from "@seamless-auth/nextjs";

import { requireAuthConfig, serveAdminConsole } from "@/lib/config";

/**
 * Serves the Seamless admin dashboard at /console, reverse-proxied from the
 * auth server. The dashboard is built to load from the same origin as /auth,
 * so it calls the cookie-based admin routes this application serves.
 *
 * Answers 404 unless SERVE_ADMIN_CONSOLE is "true", for a console hosted
 * elsewhere or not at all. The auth server only serves the dashboard with its
 * own SERVE_ADMIN_DASHBOARD on. Signed-out visitors get the dashboard too: it
 * signs them in through /auth, and its admin routes enforce the admin role.
 */
let handlers: SeamlessConsoleProxyHandlers | undefined;

function consoleProxy(): SeamlessConsoleProxyHandlers {
  handlers ??= createSeamlessConsoleProxy({
    authServerUrl: requireAuthConfig().handler.authServerUrl,
  });
  return handlers;
}

const notFound = async () => new Response("Not found", { status: 404 });

export const GET = (request: Request) =>
  serveAdminConsole() ? consoleProxy().GET(request) : notFound();
export const HEAD = (request: Request) =>
  serveAdminConsole() ? consoleProxy().HEAD(request) : notFound();
