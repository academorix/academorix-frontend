/**
 * @file index.ts
 * @module @stackra/pwa/core/utils
 * @description Barrel export for PWA core utilities.
 */

export { defineConfig } from './define-config.util';
export { mergeConfig } from './merge-config.util';
export { detectDisplayMode } from './detect-display-mode.util';
export { detectStandalone } from './detect-standalone.util';
export { detectIosSafari } from './detect-ios-safari.util';
export { parseUtmParams } from './parse-utm-params.util';
export { requestPersistentStorage } from './request-persistent-storage.util';
export {
  registerPeriodicSync,
  type IRegisterPeriodicSyncOptions,
} from './register-periodic-sync.util';
export { registerBackgroundSync } from './register-background-sync.util';
