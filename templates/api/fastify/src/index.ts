import cookie from "@fastify/cookie";
import cors, { type FastifyCorsOptionsDelegatePromise } from "@fastify/cors";
import dotenv from "dotenv";
import Fastify, { type FastifyRequest } from "fastify";
import seamlessAuth, {
  requireAuth,
  seamlessConsoleProxy,
  type SeamlessAuthMessagingOptions,
  type SeamlessAuthServerOptions,
} from "@seamless-auth/fastify";

import { connectToDb } from "./db.js";
import { initializeModels } from "../models/index.js";

import beta from "./routes/beta.js";
import { requireUser } from "./hooks/requireUser.js";
import { assertEnvironment } from "./lib/env.js";
import getLogger, { rootLogger } from "./lib/logger.js";

dotenv.config();

assertEnvironment();

// `||` rather than `??`: an empty PORT= in .env is a missing value, not a
// request for port 0, which is what Number("") would bind.
const PORT = Number(process.env.PORT || 3000);
const logger = getLogger("index");

const rawOrigins = process.env.UI_ORIGINS;
const allowedOrigins = rawOrigins?.split(",").map((o) => o.trim()) ?? [];
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

const cookiePrefix = process.env.AUTH_COOKIE_PREFIX?.trim() || "seamless-";

const cookieNames = {
  accessCookieName: `${cookiePrefix}access`,
  refreshCookieName: `${cookiePrefix}refresh`,
  registrationCookieName: `${cookiePrefix}ephemeral`,
  preAuthCookieName: `${cookiePrefix}ephemeral`,
};

// A request whose Origin is this server's own host is same-origin and was never
// a CORS concern. It has to be allowed explicitly because the admin console is
// served from this API at /console: browsers omit Origin on a same-origin GET but
// send it on POST/PATCH/DELETE, so without this the console's reads succeed while
// every write is rejected. Comparing hosts rather than full origins keeps this
// working behind a TLS-terminating proxy, where the request scheme is http.
const isSameOrigin = (origin: string, req: FastifyRequest) => {
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
};

const corsDelegate: FastifyCorsOptionsDelegatePromise = async (req) => {
  const origin = req.headers.origin;

  // No Origin at all is a same-origin GET or a non-browser caller (curl, tests).
  if (!origin || isSameOrigin(origin, req) || allowedOrigins.includes(origin)) {
    return { origin: true, credentials: true };
  }

  logger.warn(`Unknown CORS origin: ${origin}`);

  // Deny by withholding the CORS headers and letting the browser block the
  // response. Throwing here instead would answer every disallowed request with a
  // 500, which reads as a server fault rather than a policy one.
  return { origin: false, credentials: true };
};

const app = Fastify({ loggerInstance: rootLogger });

app.get("/", async () => "Seamless API is running.");

// Configuring `messaging` makes this API responsible for delivering OTPs and
// magic links: Seamless Auth returns the token to the adapter instead of sending
// it upstream. In development that lets you read the code straight from these
// logs without a mail or SMS provider. Swap these handlers for real transports
// (or set messaging.email / messaging.sms) before deploying, and never log a
// live token in production.
const devMessaging: SeamlessAuthMessagingOptions | undefined =
  process.env.NODE_ENV === "development"
    ? {
        handlers: {
          sendOtpEmail: async ({ to, token }) => {
            logger.info(`Dev OTP for ${to}: ${token}`);
            return { accepted: true, provider: "console", channel: "email" };
          },
          sendOtpSms: async ({ to, token }) => {
            logger.info(`Dev OTP for ${to}: ${token}`);
            return { accepted: true, provider: "console", channel: "sms" };
          },
          sendMagicLinkEmail: async ({ to, magicLinkUrl }) => {
            logger.info(`Dev magic link for ${to}: ${magicLinkUrl}`);
            return { accepted: true, provider: "console", channel: "email" };
          },
        },
      }
    : undefined;

const seamlessAuthOptions: SeamlessAuthServerOptions = {
  authServerUrl: process.env.AUTH_SERVER_URL!,
  cookieSecret: process.env.COOKIE_SIGNING_KEY!,
  serviceSecret: process.env.API_SERVICE_TOKEN!,
  audience: process.env.AUTH_SERVER_URL!,
  jwksKid: process.env.JWKS_KID!,
  cookieDomain,
  ...cookieNames,
  messaging: devMessaging,
};

// Serves the Seamless admin dashboard from this API's own origin, so the SPA
// shares the cookie scope of the /auth routes below.
//
// Registered on the root instance, outside the encapsulated scope that carries
// the CORS allowlist and the auth guards. The console is same-origin static
// content served by this API, not a cross-origin API call, so gating it on
// UI_ORIGINS would reject the SPA's own asset requests (its module script is
// crossorigin, so the browser sends an Origin header). It also has to load for a
// signed-out admin, who then signs in through /auth; the dashboard's own routes
// enforce the admin role.
//
// Off when the console is hosted elsewhere (a standalone container, or not at
// all). Serving it here also requires this API's origin in the auth server's
// ORIGINS so passkey ceremonies started in the console verify, see README.
if (process.env.SERVE_ADMIN_CONSOLE === "true") {
  await app.register(seamlessConsoleProxy, {
    prefix: "/console",
    authServerUrl: seamlessAuthOptions.authServerUrl,
  });
}

await app.register(async (api) => {
  // @fastify/cors is a fastify-plugin, so its hook attaches to this scope rather
  // than to the root. That is what keeps the console proxy above out of CORS.
  await api.register(cors, { delegator: corsDelegate });

  await api.register(seamlessAuth, { prefix: "/auth", ...seamlessAuthOptions });

  // Everything registered inside here requires a session. Fastify's
  // encapsulation is what scopes the guards, so the health check, the console,
  // and the /auth routes themselves stay reachable to a signed-out caller.
  await api.register(async (secured) => {
    // requireAuth and getSeamlessUser read request.cookies. The auth plugin
    // registers @fastify/cookie for its own routes, and that registration is
    // encapsulated there, so this scope has to register it too or every guarded
    // request 401s with no cookie in sight.
    await secured.register(cookie);

    secured.addHook(
      "preHandler",
      requireAuth({
        cookieSecret: seamlessAuthOptions.cookieSecret,
        cookieName: seamlessAuthOptions.accessCookieName,
      }),
    );
    secured.addHook("preHandler", requireUser(seamlessAuthOptions));

    await secured.register(beta, { prefix: "/beta_users" });
  });
});

const models = await initializeModels();

await connectToDb(models);

// Fastify binds to localhost by default, which is unreachable from outside the
// container when this runs under Docker.
await app.listen({ port: PORT, host: "0.0.0.0" });
