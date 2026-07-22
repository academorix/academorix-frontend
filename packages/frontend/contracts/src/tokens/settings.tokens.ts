/**
 * @file settings.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens + metadata keys for the `@stackra/settings`
 *   package. Feature packages inject these directly from
 *   `@stackra/contracts` — never re-exported from `@stackra/settings`.
 */

// ═══════════════════════════════════════════════════════════════════════
// DI Tokens
// ═══════════════════════════════════════════════════════════════════════

/**
 * Token for the resolved `ISettingsConfig` — the merged options
 * (`DEFAULT_SETTINGS_CONFIG` ∪ user overrides) that every service in
 * the settings package reads to drive its behaviour.
 *
 * @remarks Bound in `SettingsModule.forRoot`.
 */
export const SETTINGS_CONFIG = Symbol.for("SETTINGS_CONFIG");

/**
 * Token for the `ISettingsService` — the high-level get/set/subscribe
 * API consumers interact with.
 *
 * @remarks Bound in `SettingsModule.forRoot` to the `SettingsService`
 *   implementation.
 */
export const SETTINGS_SERVICE = Symbol.for("SETTINGS_SERVICE");

/**
 * Token for the `ISettingsRegistry` — the in-memory registry of every
 * setting group (local DTO or remote-schema-driven).
 *
 * @remarks Bound in `SettingsModule.forRoot` to the `SettingsRegistry`
 *   implementation. Populated at boot by `SettingsModule.forFeature` and
 *   `SettingsSchemaFetcher`.
 */
export const SETTINGS_REGISTRY = Symbol.for("SETTINGS_REGISTRY");

/**
 * Token for the `ISettingsManager` — the multi-instance manager that
 * owns named `ISettingsStore` instances (memory, storage, api).
 *
 * @remarks Bound in `SettingsModule.forRoot` to the
 *   `SettingsStoreManager` implementation.
 */
export const SETTINGS_MANAGER = Symbol.for("SETTINGS_MANAGER");

// ═══════════════════════════════════════════════════════════════════════
// Metadata Keys
// ═══════════════════════════════════════════════════════════════════════

/**
 * Metadata key used by the `@Setting()` class decorator. Read by
 * `SettingsRegistry.registerClass` to resolve group-level metadata.
 */
export const SETTING_METADATA_KEY = "stackra:settings:setting";

/**
 * Metadata key used by the `@Field()` property decorator. Read by
 * `SettingsRegistry.registerClass` to resolve per-property field
 * descriptors.
 */
export const FIELD_METADATA_KEY = "stackra:settings:field";

/**
 * Metadata key used by the `@Group()` property decorator. Read by
 * `SettingsRegistry.registerClass` to resolve per-property visual
 * group assignments.
 */
export const GROUP_METADATA_KEY = "stackra:settings:group";

/**
 * Metadata key used by the `@Section()` property decorator. Read by
 * `SettingsRegistry.registerClass` to resolve per-property visual
 * section dividers.
 */
export const SECTION_METADATA_KEY = "stackra:settings:section";
