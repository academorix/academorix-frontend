/**
 * @file defaults.constant.ts
 * @module @stackra/pwa/core/constants
 * @description Default configuration values for the PWA module.
 *
 *   Every field below has a matching optional in {@link IPwaModuleOptions};
 *   `mergeConfig(options)` spreads the user's options under these
 *   defaults so `PwaModule.forRoot()` with no arguments still yields
 *   a fully-typed working configuration.
 */

import type { IPwaModuleOptions } from "../interfaces";

/**
 * The single source of default options for `PwaModule.forRoot`.
 *
 * Fields:
 * - `install.delayMs` — how long after `beforeinstallprompt` fires the
 *   in-app banner is shown. 30s by default so the user has time to
 *   engage before we ask.
 * - `install.dismissKey` — storage key holding the accumulated dismiss
 *   count so the banner respects `maxDismissals`.
 * - `install.maxDismissals` — after this many "not now" clicks the
 *   banner stops appearing.
 * - `update.pollingIntervalMs` — how often the service-worker
 *   registration is asked to `.update()` and check for a waiting worker.
 * - `autoRequestPersistent` — whether `PwaService.onModuleInit()`
 *   requests persistent storage on boot.
 */
export const DEFAULT_PWA_CONFIG: IPwaModuleOptions = {
  install: {
    delayMs: 30_000,
    dismissKey: "stackra:pwa:install-dismissed",
    maxDismissals: 3,
  },
  update: {
    pollingIntervalMs: 60_000,
  },
  autoRequestPersistent: false,
};
