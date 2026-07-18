/**
 * @file index.ts
 * @module @stackra/routing/react/components/fallbacks/default-error-fallback
 * @description Framework-default error fallback — re-export from
 *   `@stackra/error/react`.
 *
 *   The error package already ships a HeroUI-based error card with
 *   details toggle. We re-export the component here so callers can
 *   import from a single place (`@stackra/routing/react`) without
 *   also having to install `@stackra/error`. `@stackra/error` is a
 *   hard peer of routing, so the re-export is safe.
 */

export { DefaultErrorFallback } from "@stackra/error/react";
