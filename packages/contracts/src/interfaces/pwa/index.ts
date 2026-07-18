/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/pwa
 * @description Barrel for cross-package PWA contracts.
 *
 *   The `@stackra/pwa` package owns the runtime; this folder just
 *   exposes the shapes and tokens other packages inject to consume
 *   PWA state (app version, install prompts, etc.) without pulling
 *   in the PWA runtime.
 */

export type { IAppVersion, IAppVersionPlatformState } from "./app-version.interface";
export type {
  IAppVersionService,
  IAppVersionStaleness,
  AppVersionSubscriber,
  AppVersionUnsubscribe,
} from "./app-version-service.interface";
