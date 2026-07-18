/**
 * @file analytics-csp.util.ts
 * @module @stackra/analytics/core/utils
 * @description Derive the CSP directive contributions for the destinations
 *   a config enables — so the CSP allow-list can't drift from the set of
 *   active providers.
 */

import type { IAnalyticsCspDirectives, IAnalyticsModuleOptions } from '../interfaces';
import { GA4_CSP } from '../providers/ga4-analytics.provider';
import { META_PIXEL_CSP } from '../providers/meta-pixel.provider';
import { TIKTOK_PIXEL_CSP } from '../providers/tiktok-pixel.provider';
import { SNAPCHAT_PIXEL_CSP } from '../providers/snapchat-pixel.provider';

/**
 * Return the CSP directive fragments required by the script-injecting
 * providers the given config enables (GA4 + marketing pixels). The console
 * provider injects nothing, so it contributes no CSP.
 *
 * Feed the result to `@stackra/csp`'s `forFeature`:
 *
 * ```ts
 * imports: [
 *   CspModule.forRoot(cspConfig),
 *   ...getAnalyticsCspPolicies(analyticsConfig).map((p) => CspModule.forFeature(p)),
 *   AnalyticsModule.forRoot(analyticsConfig),
 * ]
 * ```
 *
 * @param config - The analytics module configuration.
 * @returns One {@link IAnalyticsCspDirectives} per enabled network provider.
 */
export function getAnalyticsCspPolicies(
  config: IAnalyticsModuleOptions
): IAnalyticsCspDirectives[] {
  const byDriver: Record<string, IAnalyticsCspDirectives> = {
    ga4: GA4_CSP,
    'meta-pixel': META_PIXEL_CSP,
    'tiktok-pixel': TIKTOK_PIXEL_CSP,
    'snapchat-pixel': SNAPCHAT_PIXEL_CSP,
  };

  const policies: IAnalyticsCspDirectives[] = [];
  const seen = new Set<string>();
  for (const instance of Object.values(config.providers ?? {})) {
    const policy = byDriver[instance.driver];
    if (policy && !seen.has(policy.name)) {
      seen.add(policy.name);
      policies.push(policy);
    }
  }
  return policies;
}
