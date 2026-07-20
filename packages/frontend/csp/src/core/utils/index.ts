/**
 * @file index.ts
 * @module @stackra/csp/core/utils
 * @description Utils barrel export.
 */

// Re-exported from @stackra/support (the canonical home) for public-API
// back-compat — csp historically exposed these helpers.
export { createSeedLoader, seedLoaderToken, type SeedLoader } from '@stackra/support';
