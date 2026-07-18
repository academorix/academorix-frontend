/**
 * @file index.ts
 * @module @academorix/dashboard/services/theme
 * @description Public API barrel for the theme service — re-exports the
 *   concrete service class and its snapshot interface so consumers can
 *   import both from a single subpath.
 *
 *   The DI token lives under `@/tokens/theme-service.token` (per
 *   `code-standards.md` — tokens folder is one-per-file); everything else
 *   funnels through this barrel.
 */

export { ThemeService } from "./theme.service";
export type { IThemeSnapshot } from "./theme.interface";
