/**
 * @file default-realtime-config.constant.ts
 * @module @stackra/realtime/constants
 * @description Default configuration applied to every `RealtimeModule.forRoot()`
 *   registration. Currently empty — add real defaults here when the
 *   module starts taking user options with sensible fallbacks.
 *
 *   Use `mergeRealtimeConfig()` from `../utils` to apply the merge.
 */

/**
 * Default configuration applied to every `RealtimeModule` registration.
 *
 * Empty for now — package author adds real defaults later. Until then,
 * `mergeRealtimeConfig()` is an identity passthrough.
 */
export const DEFAULT_REALTIME_CONFIG: Readonly<Record<string, never>> = Object.freeze({});
