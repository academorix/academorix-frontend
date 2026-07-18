/**
 * @file is-node.util.ts
 * @module @stackra/config/core/utils
 * @description Runtime helper — returns `true` when the current
 *   execution context is Node.js (so the caller can safely reach for
 *   `fs`, `path`, and `dotenv` via dynamic import).
 *
 *   **Stackra addition** — nestjs assumes Node unconditionally. Ours
 *   guards every Node-only path so the browser bundle stays clean
 *   (`packages/config/dist/index.mjs` when tree-shaken by Vite MUST
 *   NOT reference `fs` / `path` / `dotenv` / `dotenv-expand`).
 */

/**
 * Detect whether the current runtime is a Node.js process.
 *
 * Uses three orthogonal signals so a false positive would require
 * every one of `process`, `process.versions`, and `process.versions.node`
 * to be present — which no non-Node runtime accidentally exposes.
 *
 * @returns `true` when Node-only APIs (`fs`, `path`, `process.env`)
 *   are safe to call; `false` in browser / Vite / Deno / Bun without
 *   Node-compat polyfills.
 *
 * @example
 * ```typescript
 * if (isNode()) {
 *   const fs = await import('node:fs');
 *   fs.readFileSync(...);
 * }
 * ```
 */
export function isNode(): boolean {
  // Narrow the two-step check to a single expression so the tree-shaker
  // sees a stable guard shape and can eliminate the Node branch when
  // it's dead-code-eliminated by a browser bundler.
  return (
    typeof process !== "undefined" &&
    process.versions !== null &&
    typeof process.versions === "object" &&
    typeof process.versions.node !== "undefined"
  );
}
