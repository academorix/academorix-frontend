/**
 * @file merged-csp-sources.type.ts
 * @module @stackra/csp/core/types
 * @description The merged CSP directive sources from all registered feature
 *   policies combined with the root configuration.
 */

import type { CspSource } from './csp-source.type';

/**
 * CSP directive key names that map to standard CSP directives.
 */
type DirectiveKey =
  | 'defaultSrc'
  | 'scriptSrc'
  | 'styleSrc'
  | 'imgSrc'
  | 'connectSrc'
  | 'fontSrc'
  | 'frameSrc'
  | 'objectSrc'
  | 'workerSrc'
  | 'mediaSrc'
  | 'baseUri'
  | 'formAction';

/**
 * Merged directive sources map.
 *
 * Each key is a CSP directive name, and the value is the de-duplicated
 * array of all sources from root config + feature policies.
 */
export type MergedCspSources = Record<DirectiveKey, CspSource[]>;
