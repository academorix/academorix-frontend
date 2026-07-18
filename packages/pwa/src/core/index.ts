/**
 * @file index.ts
 * @module @stackra/pwa
 * @description Public API for the `@stackra/pwa` core subpath — the
 *   PWA DI module, injectable services, event constants, tokens,
 *   errors, pure utilities, and interfaces.
 *
 *   React bindings live in `@stackra/pwa/react`. Build-time helpers
 *   live in `@stackra/pwa/manifest`, `@stackra/pwa/workbox`,
 *   `@stackra/pwa/vite`, and `@stackra/pwa/twa`.
 *
 *   Push notifications and the in-app notification centre have moved
 *   to `@stackra/notifications` (`@stackra/notifications/push`,
 *   `@stackra/notifications/react`).
 */

import 'reflect-metadata';

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { PwaModule } from './pwa.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export {
  PwaService,
  AnalyticsBridgeService,
  AppUpdateService,
  type PwaListener,
  type AppUpdateListener,
  type IBeforeInstallPromptEvent,
} from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Constants / Tokens
// ════════════════════════════════════════════════════════════════════════════════
export {
  APP_UPDATE_SERVICE,
  DEFAULT_PWA_CONFIG,
  PWA_CONFIG,
  PWA_SERVICE,
  PWA_EVENTS,
  type PwaEventName,
} from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { PwaError } from './errors';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export {
  defineConfig,
  detectDisplayMode,
  detectStandalone,
  detectIosSafari,
  parseUtmParams,
  requestPersistentStorage,
  registerPeriodicSync,
  registerBackgroundSync,
  type IRegisterPeriodicSyncOptions,
} from './utils';

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type {
  IPwaModuleOptions,
  IPwaInstallState,
  IPwaUpdateState,
  IPwaSnapshot,
  IPwaAttribution,
  IPwaUtmParams,
  PwaDisplayMode,
  IPwaInstallConfig,
  IPwaUpdateConfig,
  IAppUpdateConfig,
  IAppUpdateEndpoints,
  IAppUpdateManifest,
  IAppUpdateState,
} from './interfaces';
