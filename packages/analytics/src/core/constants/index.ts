/**
 * @file index.ts
 * @module @stackra/analytics/core/constants
 * @description Defaults, consent categories, and the (decoupled) consent
 *   manager token.
 */

import type { IAnalyticsModuleOptions } from '../interfaces';

/** Default analytics configuration — a console instance, consent enforced + buffered. */
export const DEFAULT_ANALYTICS_CONFIG: IAnalyticsModuleOptions = {
  default: 'console',
  providers: {
    console: { driver: 'console' },
  },
  requireConsent: true,
  bufferUntilConsent: true,
  bufferLimit: 100,
};

/**
 * Required config fields per built-in driver. An instance whose required
 * field is missing/empty is pruned by `mergeConfig` — so consumers can wire
 * ids from env unconditionally and let the module skip unset ones. Custom
 * drivers have no entry ⇒ never pruned for missing fields (only by
 * `enabled: false`).
 */
export const ANALYTICS_REQUIRED_FIELDS: Record<string, string[]> = {
  ga4: ['measurementId'],
  'meta-pixel': ['pixelId'],
  'tiktok-pixel': ['pixelId'],
  'snapchat-pixel': ['pixelId'],
};

/** Consent category slug used by product-analytics destinations (GA4). */
export const CONSENT_CATEGORY_ANALYTICS = 'analytics';

/** Consent category slug used by marketing pixels (Meta / TikTok / Snapchat). */
export const CONSENT_CATEGORY_MARKETING = 'marketing';

/**
 * Global token for `@stackra/consent`'s manager, reconstructed via
 * `Symbol.for` so we can inject it optionally without a hard dependency on
 * the consent package. `Symbol.for('CONSENT_MANAGER')` is identical to the
 * symbol consent registers under.
 */
export const CONSENT_MANAGER_TOKEN = Symbol.for('CONSENT_MANAGER');
