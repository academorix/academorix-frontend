/**
 * @file store-feature-config.interface.ts
 * @module @stackra/contracts/interfaces/state
 * @description Configuration contract for registering a reactive store with
 *   full reactive capabilities (optimistic, cross-tab, realtime, persistence).
 *
 *   Lives in contracts so feature packages (i18n, theming, consent) can
 *   declare store configs typed against a single source of truth, and so
 *   the `@stackra/state` module can accept them without a runtime coupling.
 */

/**
 * Where persisted store state is written.
 *
 * The value is looked up as an `IStorage` **instance name** on the
 * app's `StorageManager` — the app declares matching instances in
 * `WebStorageModule.forRoot({ stores })` /
 * `NativeStorageModule.forRoot({ stores })`.
 *
 * - `'localStorage'` / `'sessionStorage'` / `'asyncStorage'` — the
 *   conventional names for the built-in web / native drivers.
 * - Any other string — a custom instance name declared by the app
 *   (or a driver registered via `StorageModule.forFeature`).
 * - `false` — opt out of persistence entirely.
 */
export type PersistenceTarget =
  "localStorage" | "sessionStorage" | "asyncStorage" | (string & {}) | false;

/**
 * How incoming realtime (WebSocket) updates are applied to a store.
 *
 * - `"instant"` — apply immediately (default).
 * - `"prompt"` — queue and emit a `realtime.pending` event for the UI to confirm.
 * - `"manual"` — queue; the app calls `applyPending()` explicitly.
 * - `"next-open"` — stash for the next page load.
 */
export type UpdateStrategy = "instant" | "prompt" | "manual" | "next-open";

/**
 * Full reactive-store configuration accepted by the state module's
 * `forFeature(...)`.
 *
 * @typeParam S - The state shape.
 */
export interface IStoreFeatureConfig<S = unknown> {
  /**
   * Human-readable store name — used for devtools, event prefixes, and
   * registry lookups. Convention: lowercase domain (e.g. `i18n`, `theme`).
   */
  name: string;

  /** The DI token (Symbol) the store is registered under. */
  token: symbol;

  /** The initial state for the store. */
  initialState: S;

  /** Enable optimistic mutation support. @default false */
  optimistic?: boolean;

  /** Sync state across browser tabs. @default true */
  crossTab?: boolean;

  /** Apply realtime (WebSocket) updates to the store. @default false */
  realtime?: boolean;

  /** Persist state to storage. @default "localStorage" */
  persistence?: PersistenceTarget;

  /** How realtime updates are applied when `realtime` is enabled. @default "instant" */
  updateStrategy?: UpdateStrategy;
}
