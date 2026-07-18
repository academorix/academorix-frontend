/**
 * @file csp-policy.decorator.ts
 * @module @stackra/csp/core/decorators
 * @description `@CspPolicy()` — marks an `@Injectable()` class as a CSP
 *   policy contributor for auto-discovery. The `CspPolicyLoader` discovers
 *   these at bootstrap time and registers their CSP sources with the
 *   `CspRegistry`.
 *
 *   This enables packages to declare their CSP needs without importing
 *   `CspModule` or calling `CspModule.forFeature()`.
 *
 * @example
 * ```typescript
 * import { Injectable } from '@stackra/container';
 * import { CspPolicy } from '@stackra/csp';
 *
 * @CspPolicy({
 *   name: 'google-analytics',
 *   scriptSrc: ['https://www.googletagmanager.com'],
 *   connectSrc: ['https://www.google-analytics.com'],
 * })
 * @Injectable()
 * export class GoogleAnalyticsService {}
 * ```
 */

import { defineMetadata } from '@vivtel/metadata';

import { CSP_POLICY_METADATA } from '../constants';
import type { CspFeaturePolicy } from '../interfaces/csp-feature-policy.interface';

/**
 * Marks a class as a CSP policy contributor for auto-discovery.
 *
 * @param policy - CSP feature policy (name + directive sources).
 * @returns A class decorator.
 */
export function CspPolicy(policy: CspFeaturePolicy): ClassDecorator {
  return (target: object) => {
    defineMetadata(CSP_POLICY_METADATA, policy, target);
  };
}
