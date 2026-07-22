/**
 * @file index.ts
 * @module @stackra/logger/core/decorators
 * @description Barrel export for logger decorators.
 */

export { Reporter } from "./reporter.decorator";

// The historical `REPORTER_METADATA_KEY` legacy alias is retired.
// Import `LOGGER_REPORTER_METADATA_KEY` directly from
// `@stackra/contracts` per contract-reexports.md.
