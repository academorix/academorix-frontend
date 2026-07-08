/**
 * @file instrumentation-client.ts
 * @description
 * Browser-side Sentry init. Loaded by Next.js as part of the client
 * bundle at boot. Gated behind `NEXT_PUBLIC_SENTRY_DSN` so local dev
 * without a DSN produces zero SDK activity.
 *
 * ## Sampling
 *
 * 100% error capture, 10% transaction trace capture (via
 * `NEXT_PUBLIC_SENTRY_TRACES_RATE`), 10% replay-on-error (via
 * `NEXT_PUBLIC_SENTRY_REPLAY_RATE`). Session replay masks all text
 * and blocks all media by default.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE ?? 0.1),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_RATE ?? 0.1),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
