/**
 * @file not-found.tsx
 * @module app/not-found
 *
 * @description
 * Root-level 404 fallback. Only fires when the middleware couldn't resolve
 * a locale (which is unusual — the middleware handles every non-API,
 * non-static URL and will always redirect to `/{defaultLocale}`).
 *
 * The `[locale]` subtree has its own localised 404
 * (`app/[locale]/not-found.tsx`) that renders the full marketing chrome +
 * translated copy. That one is what visitors see when they hit a bad slug
 * under a valid locale prefix; this file is the bare-metal fallback for
 * paths the routing layer literally can't parse.
 */

import Link from "next/link";

import type { ReactNode } from "react";

/** Bare-fallback 404 page. */
export default function RootNotFound(): ReactNode {
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
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          404
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: 0 }}>Page not found</h1>
        <p style={{ maxWidth: "32rem", color: "#6b7280" }}>
          The page you were looking for moved, or maybe it never existed.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "9999px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          Go home
        </Link>
      </body>
    </html>
  );
}
