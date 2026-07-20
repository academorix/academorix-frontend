/**
 * @file index.ts
 * @module @stackra/settings/react
 * @description Public API for the settings React subpath.
 *
 *   Re-exports every React-related symbol organised by category:
 *   context, provider, hooks, components. Cross-platform hooks
 *   live in `core/hooks` and are re-exported here so consumers only
 *   pay one import path.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Context
// ════════════════════════════════════════════════════════════════════════════════
export { SettingsContext, type ISettingsContextValue } from "./contexts/settings";

// ════════════════════════════════════════════════════════════════════════════════
// Provider
// ════════════════════════════════════════════════════════════════════════════════
export { SettingsProvider, type ISettingsProviderProps } from "./providers/settings-provider";

// ════════════════════════════════════════════════════════════════════════════════
// Cross-platform hooks (source lives in `core/hooks`)
// ════════════════════════════════════════════════════════════════════════════════
export { useSettings, type IUseSettingsResult } from "@/core/hooks/use-settings";
export { useSettingValue, type IUseSettingValueResult } from "@/core/hooks/use-setting-value";
export { useSettingsSchema } from "@/core/hooks/use-settings-schema";

// ════════════════════════════════════════════════════════════════════════════════
// React-only hooks
// ════════════════════════════════════════════════════════════════════════════════
export {
  useUpdateSettings,
  type IUseUpdateSettingsResult,
  type UpdateSettingsMutate,
} from "./hooks";

// ════════════════════════════════════════════════════════════════════════════════
// Components
// ════════════════════════════════════════════════════════════════════════════════
export { SettingField, type ISettingFieldProps } from "./components/setting-field";
export { SettingsForm, type ISettingsFormProps } from "./components/settings-form";
