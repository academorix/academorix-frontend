/**
 * @file define-config.util.ts
 * @module @stackra/notifications/core/utils
 * @description Typed identity helper for authoring
 *   `notifications.config.ts`.
 */

import type { INotificationModuleOptions } from "../interfaces";

/**
 * Type-safe notifications configuration helper — identity
 * pass-through for inference + IDE autocompletion.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@stackra/notifications';
 *
 * export const notificationsConfig = defineConfig({
 *   centre: { storage: 'localStorage', maxItems: 200 },
 *   push: { vapidPublicKey: import.meta.env.VITE_VAPID_KEY as string },
 * });
 * ```
 */
export function defineConfig(config: INotificationModuleOptions): INotificationModuleOptions {
  return config;
}
