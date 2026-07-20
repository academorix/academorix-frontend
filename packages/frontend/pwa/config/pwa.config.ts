/**
 * @file pwa.config.ts
 * @module @stackra/pwa/config
 * @description Application-level PWA configuration template.
 *   Copy into your app's `src/config/` and import into your AppModule.
 */

import { defineConfig } from "@stackra/pwa";

export const pwaConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Install prompt
  |--------------------------------------------------------------------------
  |
  | Controls the beforeinstallprompt UX — delay before showing, storage
  | key for dismiss count tracking, and the dismissal ceiling.
  |
  */
  install: {
    delayMs: 30_000,
    dismissKey: "stackra:pwa:install-dismissed",
    maxDismissals: 3,
  },

  /*
  |--------------------------------------------------------------------------
  | Update prompt
  |--------------------------------------------------------------------------
  |
  | How often the service worker registration checks for a waiting worker.
  |
  */
  update: {
    pollingIntervalMs: 60_000,
  },

  /*
  |--------------------------------------------------------------------------
  | Persistent storage
  |--------------------------------------------------------------------------
  |
  | When true, PwaService requests persistent-storage permission on boot.
  |
  */
  autoRequestPersistent: false,
});
