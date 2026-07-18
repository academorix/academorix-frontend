/**
 * @file consent-gate.interface.ts
 * @module @stackra/analytics/core/interfaces
 * @description Minimal structural view of `@stackra/consent`'s manager.
 *
 *   Analytics gates dispatch on consent but must NOT hard-depend on the
 *   consent package. We resolve the consent manager optionally via its
 *   global `Symbol.for('CONSENT_MANAGER')` token and type it against this
 *   narrow structural interface — the same decoupling pattern other
 *   packages use for the optional event bus.
 */

/** The subset of the consent manager the analytics system needs. */
export interface IConsentGate {
  /** Whether consent is currently granted for a category slug. */
  hasConsent(category: string): boolean;

  /**
   * Subscribe to consent changes. Optional — when present, the manager
   * flushes buffered pre-consent events as categories are granted.
   *
   * @returns An unsubscribe function.
   */
  subscribe?(listener: (prefs: Record<string, boolean>) => void): () => void;
}
