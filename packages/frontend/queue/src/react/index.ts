/**
 * @file index.ts
 * @module @stackra/queue/react
 *
 * @description
 * Public API for the queue React subpath. Provides React hooks for
 * accessing queue services from DI.
 *
 * ## Devtools contribution — pending
 *
 * The `QueueDevtoolsPanel` used to live under `./devtools/` and
 * re-export from here. It depends on `@stackra/devtools`,
 * `@stackra/support`, and `@stackra/ui` — none of which are
 * fully promoted yet. When those packages land, restore
 * `src/react/devtools/` from `.ref/packages/queue/src/react/devtools/`
 * and add the export back below.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════════════════
export { useQueue } from "./hooks";
