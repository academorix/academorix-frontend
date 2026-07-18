/**
 * @file index.ts
 * @module @stackra/sdui/react/providers
 * @description Public API barrel for SDUI's React providers.
 *
 *   `ISduiRuntime` and `ISduiNotification` are contract types — import
 *   them from `@stackra/contracts` directly, not from this barrel.
 */

export {
  SduiRuntimeProvider,
  useSduiRuntime,
  type ISduiRuntimeProviderProps,
} from './sdui-runtime.provider';
export { SduiThemeScope, type ISduiThemeScopeProps } from './sdui-theme-scope';
