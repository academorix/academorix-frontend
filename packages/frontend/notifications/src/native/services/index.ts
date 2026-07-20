/**
 * @file index.ts
 * @module @stackra/notifications/native/services
 * @description Barrel export for native services.
 *
 *   Only the RN-specific listener attacher lives here. The shared
 *   push manager is exported from
 *   `@stackra/notifications/core/services` — both platform modules
 *   bind an adapter and inject the same core manager.
 */

export { NativeNotificationManager } from "./native-notification-manager.service";
