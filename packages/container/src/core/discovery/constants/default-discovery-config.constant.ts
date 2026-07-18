/**
 * @file default-null-config.constant.ts
 * @module @stackra/null/constants
 * @description Default configuration applied to every `DiscoveryModule.forRoot()`
 *   registration. Currently empty — add real defaults here when the
 *   module starts taking user options with sensible fallbacks.
 *
 *   Use `mergeDiscoveryConfig()` from `../utils` to apply the merge.
 */

/**
 * Default configuration applied to every `DiscoveryModule` registration.
 *
 * Empty for now — package author adds real defaults later. Until then,
 * `mergeDiscoveryConfig()` is an identity passthrough.
 */
export const DEFAULT_DISCOVERY_CONFIG: Readonly<Record<string, never>> = Object.freeze({});
