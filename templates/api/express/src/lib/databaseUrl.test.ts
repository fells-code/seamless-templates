import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildDatabaseUrl, buildSslOptions } from "./databaseUrl.js";

const DB_VARS = [
  "DATABASE_URL",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "DB_SSL_REJECT_UNAUTHORIZED",
];

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(DB_VARS.map((name) => [name, process.env[name]]));
  for (const name of DB_VARS) {
    delete process.env[name];
  }
});

afterEach(() => {
  for (const [name, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

describe("buildDatabaseUrl", () => {
  it("prefers DATABASE_URL over the discrete DB_* values", () => {
    process.env.DATABASE_URL =
      "postgres://managed:secret@db.example.com:5432/app";
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.DB_NAME = "local";
    process.env.DB_USER = "local";

    expect(buildDatabaseUrl()).toBe(
      "postgres://managed:secret@db.example.com:5432/app",
    );
  });

  it("builds a connection string from the discrete DB_* values", () => {
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.DB_NAME = "app";
    process.env.DB_USER = "postgres";
    process.env.DB_PASSWORD = "postgres";

    expect(buildDatabaseUrl()).toBe(
      "postgres://postgres:postgres@localhost:5432/app",
    );
  });

  it("escapes credentials so a password with URL syntax still parses", () => {
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.DB_NAME = "app";
    process.env.DB_USER = "user@example.com";
    process.env.DB_PASSWORD = "p@ss:word/1";

    const url = buildDatabaseUrl();

    expect(new URL(url).password).toBe("p%40ss%3Aword%2F1");
    expect(decodeURIComponent(new URL(url).username)).toBe("user@example.com");
  });

  it("throws when neither DATABASE_URL nor the full DB_* set is configured", () => {
    process.env.DB_HOST = "localhost";

    expect(() => buildDatabaseUrl()).toThrow(/Set DATABASE_URL/);
  });
});

describe("buildSslOptions", () => {
  it("turns sslmode=require into driver options with verification on", () => {
    expect(
      buildSslOptions("postgres://u:p@host:5432/db?sslmode=require"),
    ).toEqual({
      require: true,
      rejectUnauthorized: true,
    });
  });

  it("drops verification only when DB_SSL_REJECT_UNAUTHORIZED is false", () => {
    process.env.DB_SSL_REJECT_UNAUTHORIZED = "false";

    expect(
      buildSslOptions("postgres://u:p@host:5432/db?sslmode=require"),
    ).toEqual({
      require: true,
      rejectUnauthorized: false,
    });
  });

  it("returns undefined without sslmode, for sslmode=disable, and for an unparsable url", () => {
    expect(buildSslOptions("postgres://u:p@host:5432/db")).toBeUndefined();
    expect(
      buildSslOptions("postgres://u:p@host:5432/db?sslmode=disable"),
    ).toBeUndefined();
    expect(buildSslOptions("not a url")).toBeUndefined();
  });
});
