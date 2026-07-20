/**
 * @file index.ts
 * @module @stackra/theming/react
 * @description Public API for the theming React/web subpath.
 *   Re-exports hooks, components, bindings, and module.
 */

// ============================================================================
// Module
// ============================================================================
export { WebThemingModule } from "./web-theming.module";

// ============================================================================
// Hooks
// ============================================================================
export { useTheme, type UseThemeReturn } from "./hooks";
export { useColorMode } from "./hooks";

// ============================================================================
// Components
// ============================================================================
export { ThemeScript } from "./components";

// ============================================================================
// Bindings
// ============================================================================
export { WebThemeBindings } from "./bindings";
