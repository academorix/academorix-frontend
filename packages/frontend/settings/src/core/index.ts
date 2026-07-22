/**
 * @file index.ts
 * @module @stackra/settings/core
 * @description Public API for the settings core module.
 *   Re-exports every package-owned symbol organized by category.
 *
 *   Contract symbols (tokens, interfaces, enums, event names) are
 *   owned by `@stackra/contracts` — import them directly from there
 *   per `.kiro/steering/contract-reexports.md`. They are NOT
 *   re-exported here.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { SettingsModule } from "./settings.module";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { SettingsService } from "./services";
export { SettingsStoreManager } from "./services";
export { SettingsSchemaFetcher } from "./services";
export { SettingsBroadcastListener } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Registries
// ════════════════════════════════════════════════════════════════════════════════
export { SettingsRegistry } from "./registries";

// ════════════════════════════════════════════════════════════════════════════════
// Stores
// ════════════════════════════════════════════════════════════════════════════════
export { MemorySettingsStore } from "./stores";
export { StorageSettingsStore, type IStorageSettingsStoreOptions } from "./stores";
export { ApiSettingsStore, type IApiSettingsStoreOptions } from "./stores";

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { Setting, getSettingMetadata, type ISettingOptions } from "./decorators";
export { Field, getFieldDescriptors, type IFieldOptions } from "./decorators";
export { Group, getGroupDescriptors, type IGroupOptions } from "./decorators";
export { Section, getSectionDescriptors, type ISectionOptions } from "./decorators";

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { SettingsError } from "./errors";
export { SettingsNotRegisteredError } from "./errors";
export { SettingsUpdateFailedError } from "./errors";
export { SettingsDriverNotRegisteredError } from "./errors";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from "./utils";
export { mergeConfig } from "./utils";
export { resolveFieldDefaults } from "./utils";
export { buildEndpointUri } from "./utils";
export { parseSchemaPayload } from "./utils";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { DEFAULT_SETTINGS_CONFIG } from "./constants";
export { DEFAULT_API_ENDPOINTS } from "./constants";
