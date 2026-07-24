import express, { Request } from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import createSeamlessAuthServer, {
  createSeamlessConsoleProxy,
  requireAuth,
  requireRole,
  SeamlessAuthServerOptions,
  SeamlessAuthMessagingOptions,
} from "@seamless-auth/express";
import { connectToDb } from "./db.js";
import { initializeModels } from "../models/index.js";

import beta from "./routes/beta.js";
import { requireUser } from "./middleware/requireUser.js";
import getLogger from "./lib/logger.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const logger = getLogger("index");

const rawOrigins = process.env.UI_ORIGINS;
const allowedOrigins = rawOrigins?.split(",").map((o) => o.trim()) ?? [];
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

// A request whose Origin is this server's own host is same-origin and was never
// a CORS concern. It has to be allowed explicitly because the admin console is
// served from this API at /console: browsers omit Origin on a same-origin GET but
// send it on POST/PATCH/DELETE, so without this the console's reads succeed while
// every write is rejected. Comparing hosts rather than full origins keeps this
// working behind a TLS-terminating proxy, where req.protocol is http.
const isSameOrigin = (origin: string, req: Request) => {
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
};

const corsOptionsDelegate = (
  req: Request,
  callback: (err: Error | null, options?: CorsOptions) => void,
) => {
  const origin = req.headers.origin;

  // No Origin at all is a same-origin GET or a non-browser caller (curl, tests).
  if (!origin || isSameOrigin(origin, req) || allowedOrigins.includes(origin)) {
    return callback(null, { origin: true, credentials: true });
  }

  logger.warn(`Unknown CORS origin: ${origin}`);

  // Deny by withholding the CORS headers and letting the browser block the
  // response. Passing an Error here instead would answer every disallowed
  // request with a 500, which reads as a server fault rather than a policy one.
  return callback(null, { origin: false, credentials: true });
};

const app = express();
app.get("/", (_req, res) => res.send("Seamless API is running."));

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
          sendBootstrapInviteEmail: async ({ to, inviteUrl }) => {
            logger.info(`Dev bootstrap invite for ${to}: ${inviteUrl}`);
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
  messaging: devMessaging,
};

// Serves the Seamless admin dashboard from this API's own origin, so the SPA
// shares the cookie scope of the /auth routes below.
//
// Mounted ahead of the CORS allowlist and requireAuth on purpose. The console is
// same-origin static content served by this API, not a cross-origin API call, so
// gating it on UI_ORIGINS would reject the SPA's own asset requests (its module
// script is crossorigin, so the browser sends an Origin header). It also has to
// load for a signed-out admin, who then signs in through /auth; the dashboard's
// own routes enforce the admin role.
app.use(
  "/console",
  createSeamlessConsoleProxy({
    authServerUrl: seamlessAuthOptions.authServerUrl,
  }),
);

app.use(express.json());
app.use(cors(corsOptionsDelegate));
app.use(cookieParser());

app.use("/auth", createSeamlessAuthServer(seamlessAuthOptions));

app.use(
  requireAuth({
    cookieSecret: seamlessAuthOptions.cookieSecret ?? "",
  }),
);

app.use(requireUser(seamlessAuthOptions));
app.use("/beta_users", requireRole("betaUser"), beta);

const models = await initializeModels();

await connectToDb(models);

app.listen(PORT, () => {
  logger.info(`API running at http://localhost:${PORT}`);
});
