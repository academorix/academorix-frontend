/**
 * @file consent-manager.interface.ts
 * @module @stackra/contracts/interfaces/consent
 * @description Public contract for the consent manager service.
 *
 *   Any package can inject `IConsentManager` via the `CONSENT_MANAGER`
 *   token to check consent state without depending on the consent package.
 */

/**
 * Consent manager — the primary API for checking and managing user
 * consent preferences across the application.
 *
 * @example
 * ```typescript
 * @Optional() @Inject(CONSENT_MANAGER) consent?: IConsentManager
 * ```
 */
export interface IConsentManager {
  /**
   * Check whether a specific consent category is currently granted.
   *
   * @param category - Category slug (e.g. `'analytics'`, `'marketing'`).
   * @returns `true` if consent is granted for the category.
   */
  hasConsent(category: string): boolean;

  /**
   * Grant consent for a specific category.
   *
   * @param category - Category slug to grant.
   */
  grantConsent(category: string): void;

  /**
   * Revoke consent for a specific category.
   *
   * @param category - Category slug to revoke.
   */
  revokeConsent(category: string): void;

  /** Grant every non-required category at once. */
  grantAll(): void;

  /** Revoke every non-required category at once. */
  revokeAll(): void;

  /**
   * Get the full consent preferences map.
   *
   * @returns Record mapping category slugs to granted (`true`) or denied (`false`).
   */
  getPreferences(): Record<string, boolean>;

  /**
   * Bulk-set consent preferences.
   *
   * @param prefs - Map of category slugs to consent state.
   */
  setPreferences(prefs: Record<string, boolean>): void;

  /**
   * Whether the user has made an explicit consent decision. Returns
   * `false` until the user interacts with the consent UI.
   */
  isDecided(): boolean;

  /**
   * Subscribe to consent state changes.
   *
   * @param listener - Callback invoked with the full preferences map on every change.
   * @returns Unsubscribe function.
   */
  subscribe(listener: (prefs: Record<string, boolean>) => void): () => void;

  /**
   * Current stable snapshot of the preferences map.
   *
   * The reference is stable between mutations so `useSyncExternalStore`-
   * style subscribers can compare snapshots by identity.
   */
  getSnapshot(): Record<string, boolean>;
}
