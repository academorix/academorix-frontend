/**
 * @file notifications.config.ts
 * @module @stackra/notifications/config
 * @description Application-level notifications configuration template.
 *   Copy into your app's `src/config/` and import into your AppModule.
 */

import { defineConfig } from "@stackra/notifications";

export const notificationsConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | In-app notification centre
  |--------------------------------------------------------------------------
  |
  | Configure the durable queue used to persist received notifications.
  | The `storage` instance name maps to a store declared in
  | `WebStorageModule.forRoot({ stores: { ... } })` (web) or
  | `NativeStorageModule.forRoot(...)` (native). Omit to run in memory.
  |
  */
  centre: {
    storage: "localStorage",
    storageKey: "stackra:notifications:centre",
    maxItems: 100,
  },

  /*
  |--------------------------------------------------------------------------
  | Default channel stack
  |--------------------------------------------------------------------------
  |
  | Channels the manager dispatches to when `dispatch(payload)` is
  | called without an explicit channels array.
  |
  */
  defaultStack: ["in-app"],

  /*
  |--------------------------------------------------------------------------
  | Web Push
  |--------------------------------------------------------------------------
  |
  | Setting `push` here transitively imports `PushModule.forRoot(push)`.
  | Uncomment when the app has a VAPID key wired.
  |
  */
  // push: {
  //   vapidPublicKey: import.meta.env.VITE_VAPID_KEY as string,
  //   serviceWorkerScope: '/',
  //   userVisibleOnly: true,
  // },
});
