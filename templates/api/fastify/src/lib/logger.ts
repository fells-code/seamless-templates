import "dotenv/config";

import pino, { type Logger } from "pino";

const isProduction = process.env.NODE_ENV === "production";

/*
 * One logger for the whole process, handed to Fastify as its `loggerInstance`.
 * The Seamless Auth adapter logs through `request.log`, so sharing this instance
 * keeps its diagnostics in the same stream as the rest of the API instead of a
 * second one nobody is watching.
 *
 * pino-pretty is only wired up outside production, where logs stay as JSON for a
 * log pipeline to parse. It is a runtime dependency rather than a dev one
 * because any NODE_ENV other than production loads it, so an install that
 * omitted dev dependencies would fail to boot on a staging deploy.
 */
export const rootLogger: Logger = pino({
  level: isProduction ? "info" : "debug",
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
});

export default function getLogger(moduleName: string): Logger {
  return rootLogger.child({ module: moduleName });
}
