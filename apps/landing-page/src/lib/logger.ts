/**
 * @file logger.ts
 * @module lib/logger
 *
 * @description
 * Server-side structured logger backed by `pino`. Every non-console
 * emission on the server side should go through this module so we
 * get structured JSON in production, pretty-printed color output in
 * development, ISO-8601 timestamps, and consistent redaction on
 * common secret-carrying fields.
 *
 * On the client this module falls back to a `console`-shaped shim
 * so `logger.info(...)` is safe to call from Client Components.
 */

import pino from "pino";

import type { Logger } from "pino";

/** Whether we're rendering under a real Node runtime. */
const IS_NODE_SERVER =
  typeof process !== "undefined" &&
  typeof process.versions !== "undefined" &&
  typeof process.versions.node === "string" &&
  typeof (globalThis as { window?: unknown }).window === "undefined";

/** Build the real pino instance on Node servers. */
function buildServerLogger(): Logger {
  const isDev = process.env.NODE_ENV !== "production";

  return pino({
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    base: {
      service: "academorix-landing-page",
      env: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname,service,env",
            translateTime: "HH:MM:ss.l",
          },
        }
      : undefined,
    redact: {
      paths: [
        "authorization",
        "cookie",
        "password",
        "secret",
        "token",
        "*.authorization",
        "*.cookie",
        "*.password",
        "*.secret",
        "*.token",
      ],
      censor: "[redacted]",
    },
  });
}

/** Client-side console shim shaped like pino's method set. */
function buildClientLogger(): Pick<
  Logger,
  "trace" | "debug" | "info" | "warn" | "error" | "fatal"
> {
  const wrap =
    (fn: (...a: unknown[]) => void) =>
    (...args: unknown[]) => {
      if (process.env.NODE_ENV !== "production") fn(...args);
    };

  return {
    trace: wrap(console.debug),
    debug: wrap(console.debug),
    info: wrap(console.info),
    warn: wrap(console.warn),
    error: wrap(console.error),
    fatal: wrap(console.error),
  } as unknown as Pick<Logger, "trace" | "debug" | "info" | "warn" | "error" | "fatal">;
}

/** The shared logger. Prefer this over `console.*` on server surfaces. */
export const logger: Logger | ReturnType<typeof buildClientLogger> = IS_NODE_SERVER
  ? buildServerLogger()
  : buildClientLogger();
