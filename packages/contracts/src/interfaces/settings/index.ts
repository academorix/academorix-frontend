/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Barrel for the settings interface family.
 */

export type { ISettingFieldOption } from "./setting-field-option.interface";
export type { ISettingValidationRule } from "./setting-validation-rule.interface";
export type { ISettingField } from "./setting-field.interface";
export type { ISettingSection } from "./setting-section.interface";
export type { ISettingVisualGroup } from "./setting-visual-group.interface";
export type { ISettingDefinition } from "./setting-definition.interface";
export type { ISettingsStore } from "./settings-store.interface";
export type { ISettingsManager, ISettingsDriverCreator } from "./settings-manager.interface";
export type { ISettingsRegistry } from "./settings-registry.interface";
export type {
  ISettingsService,
  SettingsSubscriber,
  SettingsUnsubscribe,
} from "./settings-service.interface";
export type {
  ISettingsModuleOptions,
  ISettingsConfig,
  ISettingsResolvedApi,
  ISettingsResolvedBroadcasting,
  ISettingsStoreConfig,
  IMemoryStoreDriverConfig,
  IStorageStoreDriverConfig,
  IApiStoreDriverConfig,
  ISettingsGroupOverride,
  ISettingsApiEndpoints,
  ISettingsApiOptions,
  ISettingsBroadcastingOptions,
} from "./settings-module-options.interface";
