/**
 * Where this API's database lives, and how to reach it.
 *
 * `DATABASE_URL` wins when set: a managed Seamless database is handed out as a
 * connection string, and `seamless init` writes it here with placeholders for
 * the credentials you copy from the dashboard. Everything else falls back to
 * the discrete DB_* variables the local Docker stack uses.
 */
export function buildDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return url;
  }

  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

  if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER) {
    throw new Error(
      "Set DATABASE_URL, or all of DB_HOST, DB_PORT, DB_NAME and DB_USER.",
    );
  }

  const user = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD ?? "");

  return `postgres://${user}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

export interface SslOptions {
  require: true;
  rejectUnauthorized: boolean;
}

/**
 * A managed Seamless database accepts external connections over TLS only, and
 * says so with `sslmode=require` in the connection string. Sequelize does not
 * act on `sslmode`, so it has to be translated into the driver option here or
 * the connection is attempted in the clear and refused.
 *
 * Certificate verification stays on. Set `DB_SSL_REJECT_UNAUTHORIZED=false`
 * only if your database presents a certificate that does not chain to a public
 * CA, and understand that it drops protection against an intercepted
 * connection.
 */
export function buildSslOptions(databaseUrl: string): SslOptions | undefined {
  let sslmode: string | null = null;
  try {
    sslmode = new URL(databaseUrl).searchParams.get("sslmode");
  } catch {
    return undefined;
  }

  if (!sslmode || sslmode === "disable") {
    return undefined;
  }

  return {
    require: true,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}
