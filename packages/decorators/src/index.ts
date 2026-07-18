/**
 * @file index.ts
 * @module @stackra/decorators
 *
 * @description
 * Root barrel for the decorators library. Re-exports the generic
 * factories from `./core` so authors building a new domain wrapper
 * can pull everything they need from a single entry point. For
 * consuming an already-shipped domain decorator (e.g.
 * `@DevtoolsPanel`), import from the domain subpath directly:
 *
 *   import { DevtoolsPanel } from '@stackra/decorators/devtools';
 *
 * Subpath imports produce smaller bundles and make each package's
 * dependency intent explicit.
 */

export * from "./core";
