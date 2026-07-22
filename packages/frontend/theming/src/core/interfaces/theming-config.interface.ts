/**
 * @file theming-config.interface.ts
 * @module @stackra/theming/core/interfaces
 * @description Placeholder `IThemingConfig` shape — reserved for module
 *   options once `ThemingModule.forRoot(...)` starts accepting typed
 *   config. Kept as an empty interface today so consumers can name it
 *   without needing to keep both a token and a `never` shape in sync.
 */

/**
 * Options bag consumed by `ThemingModule.forRoot(...)`.
 *
 * Currently empty — the theming layer defaults every setting. Future
 * fields will be added here (opt-in-only, backwards compatible).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IThemingConfig {}
