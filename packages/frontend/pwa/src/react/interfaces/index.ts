/**
 * @file index.ts
 * @module @stackra/pwa/react/interfaces
 * @description Barrel for cross-hook / cross-component React interfaces.
 *
 *   Component prop interfaces live in each component's own
 *   `<name>.interface.ts` and are re-exported through the component's
 *   barrel — this file is reserved for shapes shared across multiple
 *   entities in the React subpath.
 */

// Intentionally empty for v0.1 — every component owns its own props
// interface; cross-entity shapes come in from `@/core/interfaces`.
export type {};
