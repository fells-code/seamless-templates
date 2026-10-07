import getLogger from "./logger.js";

const logger = getLogger("env");

/*
 * The auth options are read once at startup, so a missing value used to surface
 * as a 500 on the first authenticated request instead of as a failure to boot.
 * Checking up front reports every problem at once, with where each value comes
 * from, and throws rather than logging so the message cannot be lost to a
 * process that exits before its logs flush.
 */

interface RequiredVar {
  name: string;
  hint: string;
}

const REQUIRED: RequiredVar[] = [
  {
    name: "AUTH_SERVER_URL",
    hint: "The Seamless Auth instance this API trusts, for example http://localhost:5312.",
  },
  {
    name: "COOKIE_SIGNING_KEY",
    hint: "Any secret string. It signs the cookies this API issues.",
  },
  {
    name: "API_SERVICE_TOKEN",
    hint: "The secret shared with Seamless Auth. `seamless init` writes it for a local stack; managed applications issue it from the dashboard.",
  },
  {
    name: "JWKS_KID",
    hint: "The key id the auth server signs tokens with, for example dev-main.",
  },
];

const DISCRETE_DB_VARS = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"];

// `seamless init` writes a managed DATABASE_URL with these literal placeholders
// in place of the credentials, which only the dashboard can show.
const CREDENTIAL_PLACEHOLDERS = ["USER", "PASSWORD"];

function isBlank(value: string | undefined): boolean {
  return !value || value.trim() === "";
}

function databaseProblem(): string | null {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    const missing = DISCRETE_DB_VARS.filter((name) =>
      isBlank(process.env[name]),
    );

    if (missing.length === 0) {
      return null;
    }

    const listed = `Set DATABASE_URL, or all of ${DISCRETE_DB_VARS.join(", ")}`;

    return missing.length === DISCRETE_DB_VARS.length
      ? `${listed}.`
      : `${listed} (missing ${missing.join(", ")}).`;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "DATABASE_URL is not a valid connection string. Expected postgres://user:password@host:port/database.";
  }

  const credentials = [parsed.username, parsed.password].map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });

  if (credentials.some((part) => CREDENTIAL_PLACEHOLDERS.includes(part))) {
    return "DATABASE_URL still carries the USER and PASSWORD placeholders that `seamless init` wrote. Copy the real credentials from the Seamless dashboard.";
  }

  return null;
}

/*
 * The issuer the auth server signs with, when it differs from AUTH_SERVER_URL.
 * A host-run API against the `seamless init` Docker stack reaches the server at
 * http://localhost:5312 while it signs as http://auth:5312. Unset (or blank)
 * leaves the adapter checking against AUTH_SERVER_URL.
 */
export function authServerIssuer(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return env.AUTH_SERVER_ISSUER?.trim() || undefined;
}

// The auth server signs its issuer into `aud` as well as `iss`, so a distinct
// issuer is also the audience the adapter has to expect.
export function authServerAudience(
  env: Record<string, string | undefined> = process.env,
): string {
  return authServerIssuer(env) ?? env.AUTH_SERVER_URL!;
}

export function assertEnvironment(): void {
  const problems = REQUIRED.filter(({ name }) =>
    isBlank(process.env[name]),
  ).map(({ name, hint }) => `${name} is not set. ${hint}`);

  const database = databaseProblem();
  if (database) {
    problems.push(database);
  }

  if (isBlank(process.env.UI_ORIGINS)) {
    logger.warn(
      "UI_ORIGINS is empty, so CORS will reject every browser request from another origin. Set it to your web app origin, for example http://localhost:5173.",
    );
  }

  if (problems.length === 0) {
    return;
  }

  const heading =
    problems.length === 1
      ? "Cannot start: 1 environment problem."
      : `Cannot start: ${problems.length} environment problems.`;

  throw new Error(
    [
      "",
      heading,
      "",
      ...problems.map((problem) => `  - ${problem}`),
      "",
      "Copy .env.example to .env and fill these in, then start the API again.",
      "",
    ].join("\n"),
  );
}
