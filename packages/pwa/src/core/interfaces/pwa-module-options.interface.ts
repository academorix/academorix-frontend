/**
 * @file pwa-module-options.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Root configuration shape for `PwaModule.forRoot`.
 *
 *   Composed from the individual sub-shapes so a consumer's config
 *   file (`config/pwa.config.ts`) can be authored one section at a
 *   time and inner options remain importable in isolation from tests.
 */

import type { IPwaInstallConfig } from './install-config.interface';
import type { IPwaUpdateConfig } from './update-config.interface';
import type { IAppUpdateConfig } from './app-update-config.interface';

/**
 * Root `PwaModule.forRoot` options.
 *
 * Every field is optional — `PwaModule.forRoot()` with no arguments
 * yields a working configuration seeded from
 * `DEFAULT_PWA_CONFIG`.
 */
export interface IPwaModuleOptions {
  /** Install prompt configuration. */
  readonly install?: IPwaInstallConfig;
  /** Service-worker update-polling configuration. */
  readonly update?: IPwaUpdateConfig;
  /**
   * When `true`, `PwaService.onModuleInit()` calls
   * `navigator.storage.persist()` on boot.
   *
   * @default false
   */
  readonly autoRequestPersistent?: boolean;
  /**
   * Backend-published app-release configuration. When present,
   * `AppUpdateService` is bound; when omitted, only the
   * service-worker update flow (managed by `PwaService`) runs.
   *
   * Distinct from `update` (service-worker updates) — this handles
   * the *app version* the backend advertises via
   * `GET /api/v1/app/version` and the `app.updates` broadcast
   * channel.
   */
  readonly appUpdate?: IAppUpdateConfig;
}
