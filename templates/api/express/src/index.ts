import express from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import createSeamlessAuthServer, {
  requireAuth,
  requireRole,
  SeamlessAuthServerOptions,
  SeamlessAuthMessagingOptions,
} from "@seamless-auth/express";
import { connectToDb } from "./db";
import { initializeModels } from "../models";

import beta from "./routes/beta.js";
import { requireUser } from "./middleware/requireUser";
import getLogger from "./lib/logger";

dotenv.config();

const PORT = process.env.PORT || 3000;
const logger = getLogger("index");

const rawOrigins = process.env.UI_ORIGINS;
const allowedOrigins = rawOrigins?.split(",").map((o) => o.trim()) ?? [];
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl/postman

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      logger.warn(`Unknown CORS origin: ${origin}`);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
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

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

app.use("/auth", createSeamlessAuthServer(seamlessAuthOptions));

app.use(
  requireAuth({
    cookieSecret: seamlessAuthOptions.cookieSecret ?? "",
  }),
);

app.use(requireUser(seamlessAuthOptions));
app.use("/beta_users", requireRole("beta_user"), beta);

const models = await initializeModels();

await connectToDb(models);

app.listen(PORT, () => {
  logger.info(`API running at http://localhost:${PORT}`);
});
