/**
 * @file settings.interface.ts
 * @module @stackra/settings/react/contexts/settings
 * @description Shape of the `SettingsContext` value.
 */

/**
 * Value exposed by `SettingsProvider` through `SettingsContext`.
 */
export interface ISettingsContextValue {
  /**
   * Whether the initial schema fetch has settled (either succeeded
   * or failed). Consumers gating on `<SettingsProvider ready="waitSchema">`
   * observe this flag flip once and stay `true`.
   */
  readonly ready: boolean;
}
