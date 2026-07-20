/**
 * @file index.ts
 * @module @stackra/settings/core/hooks
 * @description Barrel for cross-platform React hooks.
 *
 *   Lives under `core/` (not `react/`) because these hooks use only
 *   platform-agnostic React APIs. The `./react` and future `./native`
 *   subpaths re-export them verbatim.
 */

export { useSettings, type IUseSettingsResult } from "./use-settings";
export { useSettingValue, type IUseSettingValueResult } from "./use-setting-value";
export { useSettingsSchema } from "./use-settings-schema";
