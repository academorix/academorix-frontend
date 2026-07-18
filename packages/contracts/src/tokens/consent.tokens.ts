/**
 * @file consent.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the consent management system.
 */

/** Injection token for the {@link IConsentManager} service. */
export const CONSENT_MANAGER = Symbol.for("CONSENT_MANAGER");

/** Injection token for the resolved consent module options / config. */
export const CONSENT_CONFIG = Symbol.for("CONSENT_CONFIG");

/** Injection token for the {@link IConsentStorageAdapter}. */
export const CONSENT_STORAGE_ADAPTER = Symbol.for("CONSENT_STORAGE_ADAPTER");
