/**
 * @file state-feature-options.interface.ts
 * @module @stackra/state/core/interfaces
 * @description Minimal options for registering a store via
 *   `StateModule.forFeature()`.
 *
 *   This is the package-owned, backward-compatible "simple" shape. The full
 *   reactive config (`IStoreFeatureConfig` with optimistic / crossTab /
 *   realtime / persistence) lives in `@stackra/contracts` so cross-package
 *   consumers can declare it without a runtime dependency.
 */

/**
 * Options for registering a single store via `StateModule.forFeature()`.
 *
 * @typeParam S - The state shape.
 *
 * @example
 * ```typescript
 * StateModule.forFeature<LocaleState>({
 *   name: "i18n",
 *   token: I18N_STORE,
 *   initialState: { locale: "en", dir: "ltr", isLoading: false },
 * })
 * ```
 */
export interface StateFeatureOptions<S = unknown> {
  /**
   * Human-readable name for the store — used in devtools, event prefixes,
   * and registry lookups. Convention: lowercase domain (e.g. "i18n", "theme").
   */
  name: string;

  /** The DI token (Symbol) to register the store under. */
  token: symbol;

  /** The initial state for the store. */
  initialState: S;
}
