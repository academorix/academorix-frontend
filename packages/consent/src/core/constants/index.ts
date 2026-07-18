/**
 * @file index.ts
 * @module @stackra/consent/core/constants
 * @description Barrel export for consent constants + the sole
 *   package-owned DI token. Shared tokens/events live in
 *   `@stackra/contracts` — import from there.
 */

export {
  DEFAULT_COOKIE_NAME,
  DEFAULT_COOKIE_MAX_AGE,
  DEFAULT_STORAGE,
  DEFAULT_MODE,
  DEFAULT_CATEGORIES,
  DEFAULT_CONSENT_CONFIG,
} from './defaults.constant';

export { CONSENT_REGISTRY } from './tokens.constant';
