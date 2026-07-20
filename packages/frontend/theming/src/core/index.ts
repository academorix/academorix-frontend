/**
 * @file index.ts
 * @module @stackra/theming
 * @description Public API for the theming module (core subpath).
 *   Re-exports all public symbols organized by category.
 */

// ============================================================================
// Module
// ============================================================================
export { ThemingModule } from "./theming.module";

// ============================================================================
// Services
// ============================================================================
export { ThemeService, ThemeApiService } from "./services";

// ============================================================================
// Registries
// ============================================================================
export { ThemeRegistry } from "./registries";

// ============================================================================
// Stores
// ============================================================================
export { ThemeTokenStore, type IThemeState } from "./stores";

// ============================================================================
// Bindings
// ============================================================================
export { NullThemeBindings } from "./bindings";

// ============================================================================
// Errors
// ============================================================================
export { ThemeBindingsNotConfiguredError, ThemeNotFoundError } from "./errors";

// ============================================================================
// Constants
// ============================================================================
export {
  DEFAULT_MODE_STORAGE_KEY,
  DEFAULT_THEME_STORAGE_KEY,
  DEFAULT_COLOR_MODE,
  DEFAULT_THEME_ID,
  THEME_DATA_ATTRIBUTE,
  THEME_DEFAULT,
  THEME_SKY,
  THEME_LAVENDER,
  THEME_MINT,
  THEME_NETFLIX,
  THEME_UBER,
  THEME_SPOTIFY,
  THEME_COINBASE,
  THEME_AIRBNB,
  THEME_DISCORD,
  THEME_RABBIT,
  BUILT_IN_THEMES,
} from "./constants";

// ============================================================================
// Utils
// ============================================================================
export {
  defineConfig,
  tokenToCssVar,
  separateTokensByMode,
  mapTokensToVars,
  resolveThemeLabel,
} from "./utils";
