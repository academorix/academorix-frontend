/**
 * @file tokens.constant.ts
 * @module @stackra/consent/core/constants
 * @description Package-owned DI tokens for `@stackra/consent`. Shared
 *   tokens (`CONSENT_MANAGER`, `CONSENT_CONFIG`, `CONSENT_STORAGE_ADAPTER`)
 *   and event names (`CONSENT_EVENTS`) live in `@stackra/contracts` —
 *   consumers and internal code import them from there directly.
 */

/**
 * Injection token for the {@link ConsentRegistry} service — the registry
 * of registered consent category definitions.
 *
 * Package-owned: consent categories are a consent-package concept and do
 * not appear in the cross-package contract surface.
 */
export const CONSENT_REGISTRY = Symbol.for('CONSENT_REGISTRY');
