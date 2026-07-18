/**
 * @file theme-registry.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Contract for the theme catalog registry.
 *
 *   The registry is the single in-memory catalog of every theme the
 *   app knows about — built-ins seeded at module init,
 *   `forFeature`-contributed themes, and API-fetched themes merged
 *   on `onApplicationBootstrap` (when `config.api` is set).
 *
 *   Wraps a reactive `Store<readonly ITheme[]>` under the hood so
 *   React consumers can bind via `useSelector(THEMES_STORE, ...)`
 *   for reactive reads; imperative consumers use the methods here.
 */

import type { ITheme } from "./theme.interface";

/**
 * How the registry handles a `register` call for an id that already
 * exists.
 *
 * - `'replace'` — overwrite the existing theme (default; last-in
 *   wins, useful for API themes overriding built-ins).
 * - `'skip'`    — keep the existing theme (useful for `forFeature`
 *   contributions that don't want to clobber user overrides).
 * - `'error'`   — throw `ThemeAlreadyExistsError`.
 */
export type ThemeConflictStrategy = "replace" | "skip" | "error";

/**
 * Options accepted by `IThemeRegistry.register`.
 */
export interface IThemeRegisterOptions {
  /**
   * How to handle a name conflict with an existing entry.
   * @default `'replace'`
   */
  readonly strategy?: ThemeConflictStrategy;
}

/**
 * Callback fired when the registry's contents change.
 */
export type ThemeRegistryListener = (themes: readonly ITheme[]) => void;

/**
 * The theme catalog registry — imperative + reactive facade over
 * the underlying `Store<readonly ITheme[]>`.
 */
export interface IThemeRegistry {
  /**
   * Insert or replace a theme in the registry. Default strategy is
   * `'replace'`; pass `'skip'` for `forFeature` seeds and `'error'`
   * for admin flows that must catch collisions.
   */
  register(theme: ITheme, options?: IThemeRegisterOptions): void;

  /**
   * Bulk register. Applies the same `options` to every theme. When
   * the strategy is `'error'`, the whole batch aborts on the first
   * collision (the registry is NOT reverted for already-inserted
   * entries — treat it as a fail-fast operation).
   */
  registerMany(themes: readonly ITheme[], options?: IThemeRegisterOptions): void;

  /** Remove a theme by id. Returns `true` when a theme was removed. */
  unregister(id: string): boolean;

  /** Lookup one theme by id, or `undefined` when absent. */
  get(id: string): ITheme | undefined;

  /** Whether a theme with the given id is registered. */
  has(id: string): boolean;

  /** Snapshot of every registered theme, in insertion order. */
  list(): readonly ITheme[];

  /**
   * Subscribe to registry changes. Fires on every mutation with
   * the fresh full list. Returns an unsubscribe function.
   */
  subscribe(listener: ThemeRegistryListener): () => void;

  /** Empty the registry. Used by tests + development hot-reload. */
  clear(): void;
}
