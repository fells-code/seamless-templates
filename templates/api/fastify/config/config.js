// sequelize-cli reads this for migrations, which run before the app starts. It
// has to resolve the database the same way the runtime does (models/index.ts),
// or a managed database would be migrated against the wrong target, or not at
// all.
//
// Plain JS with no imports on purpose: sequelize-cli loads this file directly,
// outside the TypeScript build.

function sslOptions(databaseUrl) {
  let sslmode = null;
  try {
    sslmode = new URL(databaseUrl).searchParams.get("sslmode");
  } catch {
    return undefined;
  }

  if (!sslmode || sslmode === "disable") {
    return undefined;
  }

  // A managed Seamless database accepts external connections over TLS only.
  // See src/lib/databaseUrl.ts for why verification stays on by default.
  return {
    require: true,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

function environment() {
  const url = process.env.DATABASE_URL && process.env.DATABASE_URL.trim();

  if (url) {
    const ssl = sslOptions(url);
    return {
      dialect: "postgres",
      use_env_variable: "DATABASE_URL",
      logging: false,
      ...(ssl ? { dialectOptions: { ssl } } : {}),
    };
  }

  return {
    dialect: "postgres",
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    logging: false,
  };
}

const config = {
  development: environment(),
  test: environment(),
  production: environment(),
};

export default config;
