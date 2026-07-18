/**
 * @file reporter.decorator.ts
 * @module @stackra/logger/core/decorators
 *
 * @description
 * Re-exports the `@Reporter(...)` decorator from `@stackra/decorators/logger`.
 *
 * The actual decorator implementation now lives in
 * `@stackra/decorators` so feature packages can declare a reporter
 * without pulling the full `@stackra/logger` runtime. `@stackra/logger`
 * retains this shim for backwards compatibility with consumers that
 * import from the legacy path.
 */

export { Reporter, reporterMetadata } from "@stackra/decorators/logger";
