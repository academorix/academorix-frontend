/**
 * @file index.ts
 * @module @stackra/settings/react/hooks
 * @description Barrel for React-only hooks.
 *
 *   Cross-platform hooks (`useSettings`, `useSettingValue`,
 *   `useSettingsSchema`) live under `core/hooks` and are re-exported
 *   from `react/index.ts`. This folder only houses hooks that touch
 *   a web-specific concern (e.g. `useUpdateSettings` yields a
 *   mutation lifecycle useful for HeroUI forms).
 */

export {
  useUpdateSettings,
  type IUseUpdateSettingsResult,
  type UpdateSettingsMutate,
} from "./use-update-settings";
