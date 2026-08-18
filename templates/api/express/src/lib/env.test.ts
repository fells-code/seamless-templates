import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assertEnvironment } from "./env.js";

// The real logger writes a file transport outside production, which a unit test
// has no reason to create.
vi.mock("./logger.js", () => ({
  default: () => ({ warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

const MANAGED_VARS = [
  "AUTH_SERVER_URL",
  "COOKIE_SIGNING_KEY",
  "API_SERVICE_TOKEN",
  "JWKS_KID",
  "UI_ORIGINS",
  "DATABASE_URL",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

function setValidEnvironment() {
  process.env.AUTH_SERVER_URL = "http://localhost:5312";
  process.env.COOKIE_SIGNING_KEY = "cookie-signing-key";
  process.env.API_SERVICE_TOKEN = "service-token";
  process.env.JWKS_KID = "dev-main";
  process.env.UI_ORIGINS = "http://localhost:5173";
  process.env.DATABASE_URL = "postgres://app:secret@localhost:5432/app";
}

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(
    MANAGED_VARS.map((name) => [name, process.env[name]]),
  );
  for (const name of MANAGED_VARS) {
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

describe("assertEnvironment", () => {
  it("passes on a fully configured environment", () => {
    setValidEnvironment();

    expect(() => assertEnvironment()).not.toThrow();
  });

  it("accepts the discrete DB_* values in place of DATABASE_URL", () => {
    setValidEnvironment();
    delete process.env.DATABASE_URL;
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.DB_NAME = "app";
    process.env.DB_USER = "postgres";

    expect(() => assertEnvironment()).not.toThrow();
  });

  it("reports every missing value in one message", () => {
    expect(() => assertEnvironment()).toThrow(/5 environment problems/);

    try {
      assertEnvironment();
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("AUTH_SERVER_URL is not set");
      expect(message).toContain("COOKIE_SIGNING_KEY is not set");
      expect(message).toContain("API_SERVICE_TOKEN is not set");
      expect(message).toContain("JWKS_KID is not set");
      expect(message).toContain("Set DATABASE_URL");
    }
  });

  it("names the missing half of a partial DB_* set", () => {
    setValidEnvironment();
    delete process.env.DATABASE_URL;
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";

    expect(() => assertEnvironment()).toThrow(/missing DB_NAME, DB_USER/);
  });

  it("rejects a DATABASE_URL that still carries the scaffolded placeholders", () => {
    setValidEnvironment();
    process.env.DATABASE_URL =
      "postgres://USER:PASSWORD@db.example.com:5432/app?sslmode=require";

    expect(() => assertEnvironment()).toThrow(/placeholders/);
  });

  it("rejects a DATABASE_URL that is not a connection string", () => {
    setValidEnvironment();
    process.env.DATABASE_URL = "the database on my laptop";

    expect(() => assertEnvironment()).toThrow(/not a valid connection string/);
  });

  it("treats whitespace as unset", () => {
    setValidEnvironment();
    process.env.JWKS_KID = "   ";

    expect(() => assertEnvironment()).toThrow(/JWKS_KID is not set/);
  });
});
