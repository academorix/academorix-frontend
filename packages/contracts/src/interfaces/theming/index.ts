/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Barrel export for theming interfaces + types.
 *
 *   The canonical theme shape is `ITheme` — one type shared between
 *   the frontend `@stackra/theming` package and the backend
 *   `academorix/laravel-theming` package. The pre-1.0 split
 *   between `IThemeConfig` (runtime handle) and `IThemePreset`
 *   (wire payload) is dead.
 *
 *   Every theme lives in a single `IThemeRegistry` (facade over
 *   `Store<readonly ITheme[]>`). No source/manager abstraction —
 *   API themes are fetched on `onApplicationBootstrap` and merged
 *   into the registry with a configurable conflict strategy.
 */

export type { ColorMode } from "./color-mode.type";
export type { ResolvedMode } from "./resolved-mode.type";
export type { IDesignTokenMap } from "./design-token-map.interface";
export type { ISSRScriptOptions } from "./ssr-script-options.interface";
export type { ITheme, IThemeInput } from "./theme.interface";
export type { IActiveThemeState } from "./active-theme-state.interface";
export type { IThemeBindings } from "./theme-bindings.interface";
export type {
  IThemeRegistry,
  IThemeRegisterOptions,
  ThemeConflictStrategy,
  ThemeRegistryListener,
} from "./theme-registry.interface";
