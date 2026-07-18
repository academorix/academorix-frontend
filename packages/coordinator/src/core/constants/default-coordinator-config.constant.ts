/**
 * @file default-coordinator-config.constant.ts
 * @module @stackra/coordinator/constants
 * @description Default configuration applied to every `CoordinatorModule.forRoot()`
 *   registration. Currently empty — add real defaults here when the
 *   module starts taking user options with sensible fallbacks.
 *
 *   Use `mergeCoordinatorConfig()` from `../utils` to apply the merge.
 */

/**
 * Default configuration applied to every `CoordinatorModule` registration.
 *
 * Empty for now — package author adds real defaults later. Until then,
 * `mergeCoordinatorConfig()` is an identity passthrough.
 */
export const DEFAULT_COORDINATOR_CONFIG: Readonly<Record<string, never>> = Object.freeze({});
