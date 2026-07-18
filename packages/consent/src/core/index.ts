/**
 * @file index.ts
 * @module @stackra/consent
 * @description Public API for the `@stackra/consent` core subpath — the
 *   platform-agnostic consent DI module, services, the memory adapter,
 *   the `CONSENT_REGISTRY` token, module option types, and `defineConfig`.
 *
 *   Shared contract vocabulary (`IConsentManager`, `IConsentCategory`,
 *   `IConsentStorageAdapter`, `ITranslatableLabel`, `CONSENT_MANAGER`,
 *   `CONSENT_CONFIG`, `CONSENT_STORAGE_ADAPTER`, `CONSENT_EVENTS`) lives
 *   in `@stackra/contracts` — consumers import those directly.
 */

import 'reflect-metadata';

// Module
export { ConsentModule } from './consent.module';

// Services
export { ConsentRegistry, ConsentManager } from './services';

// Adapters (platform-agnostic only)
export { MemoryConsentAdapter } from './adapters';

// Package-owned constants + the sole package-owned DI token
export {
  CONSENT_REGISTRY,
  DEFAULT_COOKIE_NAME,
  DEFAULT_COOKIE_MAX_AGE,
  DEFAULT_STORAGE,
  DEFAULT_MODE,
  DEFAULT_CATEGORIES,
  DEFAULT_CONSENT_CONFIG,
} from './constants';

// Utilities
export { defineConfig } from './utils';

// Package-owned types
export type { IConsentModuleOptions } from './types';
