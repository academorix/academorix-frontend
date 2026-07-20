/**
 * @file devtools-storage-keys.constants.ts
 * @module @stackra/devtools/core/constants
 * @description Persistence keys the devtools frame-state service
 *   writes into the configured `IStorage` instance.
 *
 *   Kept centralised so cross-package tooling (e.g. a future
 *   `@stackra/testing` fixture that pre-seeds frame state) can
 *   reference the exact same keys the service reads.
 */

/**
 * Storage key holding the persisted `IDevtoolsFrameState` snapshot
 * (`isOpen`, `activePanelId`, `position`, `size`, …).
 */
export const DEVTOOLS_FRAME_STATE_KEY = "stackra:devtools:frame-state";

/**
 * Storage key holding the user's pinned-panel id list — a superset
 * of the `'pinned'` category, promoted to the top of the rail
 * regardless of the panel's declared category.
 */
export const DEVTOOLS_PINNED_PANELS_KEY = "stackra:devtools:pinned-panels";
