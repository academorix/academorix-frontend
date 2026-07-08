/**
 * @file sentry.server.config.ts
 * @description
 * Node-runtime Sentry init. Loaded from `instrumentation.ts` when
 * `NEXT_RUNTIME === "nodejs"` and a DSN is configured.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE ?? 0.1),
    integrations: [],
  });
}
