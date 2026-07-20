/**
 * @file index.ts
 * @module @stackra/console/publishing
 * @description Public API for the publishing subdomain of `@stackra/console`.
 *
 *   Owns runtime pieces (registry, loader, consumer, errors) that the CLI
 *   uses to populate + query the publishable registry. Interface contracts
 *   live in `@stackra/contracts/interfaces/publishing` per
 *   `.kiro/steering/contract-reexports.md` — consumers import types from
 *   contracts directly, never through this barrel.
 */

// ── Errors (public — consumers may catch these) ─────────────────────
export { DuplicatePublishableTagError, InvalidPublishableEntryError } from "./errors";

// ── Registry (public — mocked in tests) ─────────────────────────────
export { PublishableRegistry } from "./registries";

// ── Loader (public — DI provider) ───────────────────────────────────
export { PublishableLoader } from "./services";

// ── Consumer implementation (public — used by tests) ────────────────
export { PublishableConsumer } from "./publishable.consumer";
