import type {
  SeamlessAuthHandlerOptions,
  SeamlessAuthMessagingOptions,
  SeamlessSessionOptions,
} from "@seamless-auth/nextjs";

import { captureEnabled, captureMessaging } from "./capture";

/*
 * Everything the server side of this application reads from the environment,
 * checked in one place. A missing value used to surface as a 500 on the first
 * authenticated request; this reports every problem at once, with where each
 * value comes from, and the layout renders them instead of the application.
 *
 * Read per request rather than at import: `next build` imports the route
 * modules, and the build has no .env to read.
 */

type Env = Record<string, string | undefined>;

export interface AuthConfig {
  handler: SeamlessAuthHandlerOptions;
  session: SeamlessSessionOptions;
}

export type AuthConfigResult =
  { ok: true; config: AuthConfig } | { ok: false; problems: string[] };

const REQUIRED = [
  {
    name: "AUTH_SERVER_URL",
    hint: "The Seamless Auth instance this application trusts, for example http://localhost:5312.",
  },
  {
    name: "COOKIE_SIGNING_KEY",
    hint: "A secret of at least 32 characters. It signs the session cookies.",
  },
  {
    name: "API_SERVICE_TOKEN",
    hint: "The secret shared with Seamless Auth. `seamless init` writes it for a local stack; managed applications issue it from the dashboard.",
  },
  {
    name: "JWKS_KID",
    hint: "The key id the auth server signs tokens with, for example dev-main.",
  },
] as const;

function isBlank(value: string | undefined): boolean {
  return !value || value.trim() === "";
}

// Configuring `messaging` makes this application responsible for delivering
// OTPs and magic links: Seamless Auth returns the token instead of sending it.
// In development that puts the code in the `next dev` output, with no mail or
// SMS provider. Swap these for real transports before deploying, and never log
// a live token in production.
const devMessaging: SeamlessAuthMessagingOptions = {
  handlers: {
    sendOtpEmail: async ({ to, token }) => {
      console.info(`[seamless] Dev OTP for ${to}: ${token}`);
      return { accepted: true, provider: "console", channel: "email" };
    },
    sendOtpSms: async ({ to, token }) => {
      console.info(`[seamless] Dev OTP for ${to}: ${token}`);
      return { accepted: true, provider: "console", channel: "sms" };
    },
    sendMagicLinkEmail: async ({ to, magicLinkUrl }) => {
      console.info(`[seamless] Dev magic link for ${to}: ${magicLinkUrl}`);
      return { accepted: true, provider: "console", channel: "email" };
    },
  },
};

export function readAuthConfig(env: Env = process.env): AuthConfigResult {
  const problems: string[] = REQUIRED.filter(({ name }) =>
    isBlank(env[name]),
  ).map(({ name, hint }) => `${name} is not set. ${hint}`);

  const signingKey = env.COOKIE_SIGNING_KEY?.trim() ?? "";
  if (signingKey && signingKey.length < 32) {
    problems.push(
      "COOKIE_SIGNING_KEY is shorter than 32 characters. Generate one with `openssl rand -base64 48`.",
    );
  }

  if (problems.length > 0) {
    return { ok: false, problems };
  }

  // Cookies ignore the port, so two Seamless applications on one host share a
  // cookie jar. A prefix keeps them apart.
  const prefix = env.AUTH_COOKIE_PREFIX?.trim() || "seamless-";
  const cookieNames = {
    accessCookieName: `${prefix}access`,
    refreshCookieName: `${prefix}refresh`,
    registrationCookieName: `${prefix}ephemeral`,
    preAuthCookieName: `${prefix}ephemeral`,
  };

  const authServerUrl = env.AUTH_SERVER_URL!.trim();
  const cookieSecret = signingKey;
  const serviceSecret = env.API_SERVICE_TOKEN!.trim();
  const jwksKid = env.JWKS_KID!.trim();
  // Only when the auth server signs as something other than the URL this app
  // reaches it at: a host-run app against the `seamless init` Docker stack calls
  // http://localhost:5312 while the server signs as http://auth:5312. Blank is
  // unset, which leaves the adapter checking against AUTH_SERVER_URL. The server
  // signs its issuer as both `iss` and `aud`, so it is the audience too.
  const authServerIssuer = env.AUTH_SERVER_ISSUER?.trim() || undefined;

  return {
    ok: true,
    config: {
      handler: {
        authServerUrl,
        authServerIssuer,
        audience: authServerIssuer ?? authServerUrl,
        cookieSecret,
        serviceSecret,
        jwksKid,
        cookieDomain: env.COOKIE_DOMAIN?.trim() || undefined,
        ...cookieNames,
        messaging: captureEnabled(env)
          ? captureMessaging
          : env.NODE_ENV === "development"
            ? devMessaging
            : undefined,
      },
      session: {
        authServerUrl,
        cookieSecret,
        serviceSecret,
        jwksKid,
        accessCookieName: cookieNames.accessCookieName,
        refreshCookieName: cookieNames.refreshCookieName,
      },
    },
  };
}

export function requireAuthConfig(env: Env = process.env): AuthConfig {
  const result = readAuthConfig(env);

  if (!result.ok) {
    throw new Error(
      ["Seamless Auth is not configured:", ...result.problems].join("\n  - "),
    );
  }

  return result.config;
}

/**
 * Whether this application serves the admin dashboard at /console. Only the
 * exact string "true" turns it on, as in the Express and Fastify starters.
 */
export function serveAdminConsole(env: Env = process.env): boolean {
  return env.SERVE_ADMIN_CONSOLE?.trim() === "true";
}
