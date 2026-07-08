/**
 * @file global-error.tsx
 * @description
 * Root-level error boundary. Catches errors that escape the locale
 * layout's `error.tsx` boundary (e.g. errors in the layout itself,
 * or in `<html>` / `<body>` rendering). Renders its own bare `<html>`
 * shell because at this point React cannot rely on any layout tree.
 *
 * ## Sentry integration
 *
 * Every caught error is forwarded to Sentry via `Sentry.captureException`
 * so the observability pipeline sees the fatal paths that the more
 * specific `error.tsx` would otherwise absorb. Only fires when a DSN
 * is configured, matching the pattern elsewhere in the app.
 *
 * ## Why bare styles
 *
 * At the global error tier, the shared `globals.css` is not yet in
 * scope. We use inline styles so the page still reads as a real
 * error state instead of an unstyled crash.
 */

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Something broke
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0 }}>
          A fatal error kept the page from rendering
        </h1>
        <p style={{ maxWidth: "32rem", color: "#6b7280" }}>
          The team has been notified. You can try again, or head back to the home page.
        </p>
        <button
          onClick={() => reset()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "9999px",
            background: "#111",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
          type="button"
        >
          Try again
        </button>
        {error.digest ? (
          <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Error ID: {error.digest}</p>
        ) : null}
      </body>
    </html>
  );
}
