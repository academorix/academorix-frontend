/**
 * @file csp-feature-policy.interface.ts
 * @module @stackra/csp/core/interfaces
 * @description The shape of a CSP contribution registered by a feature
 *   module via `CspModule.forFeature()` or the `@CspPolicy()` decorator.
 *   Each field is optional and contributes additional sources that get
 *   merged with the root configuration.
 */

import type { CspSource } from '../types/csp-source.type';

/**
 * Feature-scoped CSP contribution.
 *
 * Mirrors the directive shape from `CspModuleOptions` but every field
 * adds to the root config rather than replacing it.
 *
 * @example
 * ```typescript
 * CspModule.forFeature({
 *   name: 'tracking',
 *   scriptSrc: ['https://www.googletagmanager.com'],
 *   imgSrc: ['https://www.facebook.com'],
 *   connectSrc: ['https://www.google-analytics.com'],
 * });
 * ```
 */
export interface CspFeaturePolicy {
  /**
   * Identifier for this contribution. Used for de-duplication and
   * debugging. If two features register with the same name, the later
   * registration replaces the earlier one.
   */
  name: string;

  /** Additional `default-src` sources. */
  defaultSrc?: CspSource[];

  /** Additional `script-src` sources. */
  scriptSrc?: CspSource[];

  /** Additional `style-src` sources. */
  styleSrc?: CspSource[];

  /** Additional `img-src` sources. */
  imgSrc?: CspSource[];

  /** Additional `connect-src` sources. */
  connectSrc?: CspSource[];

  /** Additional `font-src` sources. */
  fontSrc?: CspSource[];

  /** Additional `frame-src` sources. */
  frameSrc?: CspSource[];

  /** Additional `object-src` sources. */
  objectSrc?: CspSource[];

  /** Additional `worker-src` sources. */
  workerSrc?: CspSource[];

  /** Additional `media-src` sources. */
  mediaSrc?: CspSource[];

  /** Additional `base-uri` sources. */
  baseUri?: CspSource[];

  /** Additional `form-action` sources. */
  formAction?: CspSource[];
}
