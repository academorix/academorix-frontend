/**
 * @file index.ts
 * @module @stackra/settings/core/constants
 * @description Barrel for settings constants.
 */

export { DEFAULT_SETTINGS_CONFIG } from './default-settings-config.constant';
export { DEFAULT_API_ENDPOINTS } from './api-endpoints.constant';

// NOTE: DI tokens (SETTINGS_*) and metadata keys (SETTING_METADATA_KEY,
// FIELD_METADATA_KEY, GROUP_METADATA_KEY, SECTION_METADATA_KEY) are owned
// by @stackra/contracts — import them from there, never from here.
