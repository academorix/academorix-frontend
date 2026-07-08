/**
 * @file instrumentation.ts
 * @description
 * Next.js instrumentation hook. Runs once per runtime (Node, Edge) at
 * server boot. Single entry point for server-side observability wiring:
 * OpenTelemetry (via `@vercel/otel`) and Sentry (per-runtime SDK init).
 *
 * ## Env-gated
 *
 * All third-party observability is off by default. Presence of the
 * respective env var (`NEXT_PUBLIC_SENTRY_DSN` for Sentry,
 * `OTEL_SERVICE_NAME` for OTEL) activates each subsystem. This keeps
 * local dev quiet and makes it safe to run the app without external
 * credentials.
 */

import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  if (process.env.OTEL_SERVICE_NAME) {
    const { registerOTel } = await import("@vercel/otel");
    registerOTel({
      serviceName: process.env.OTEL_SERVICE_NAME || "academorix-landing-page",
    });
  }

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config");
    }
    if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config");
    }
  }
}

/**
 * Route-handler error hook. Called on every unhandled error thrown
 * from a Route Handler, Server Component, or Server Action.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
