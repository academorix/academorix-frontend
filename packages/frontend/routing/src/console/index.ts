/**
 * @file index.ts
 * @module @stackra/routing/console
 * @description Public API for the `@stackra/routing/console` subpath.
 *
 *   Exposes the `RoutingConsoleModule` (mount it in the CLI's root DI
 *   module) plus every command class, options shape, and helper the CLI
 *   consumer may want to import directly.
 *
 *   This subpath imports `node:fs` and `node:url` — it MUST NOT be
 *   imported from the SPA bundle. Consumers reach it via
 *   `@stackra/routing/console` (a separate tsup entry), never through
 *   the top-level `@stackra/routing` barrel.
 */

// ── Module ──────────────────────────────────────────────────────
export { RoutingConsoleModule } from "./routing-console.module";

// ── Commands ────────────────────────────────────────────────────
export { HostCommand } from "./commands";

// ── Interfaces ──────────────────────────────────────────────────
export type { IHostDiff, IHostOptions } from "./interfaces";

// ── Utilities (pure — safe to unit-test) ────────────────────────
export { computeHostDiff, parseHostOptions, renderHostBlock } from "./utils";

// ── Constants ───────────────────────────────────────────────────
export { HOST_BLOCK_BEGIN, HOST_BLOCK_END, HOSTS_PATH } from "./constants";
