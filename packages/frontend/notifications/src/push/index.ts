/**
 * @file index.ts
 * @module @stackra/notifications/push
 * @description Public API for the Web Push subpath.
 *
 *   Exports the module, the platform adapter, the OS-notification
 *   channel driver, the config token, and the wire-friendly types.
 *   The shared `PushSubscriptionManager` lives in the core subpath —
 *   consumers who want push access it through
 *   `@stackra/notifications` (`PUSH_SUBSCRIPTION_MANAGER`).
 */

import "reflect-metadata";

export { PushModule } from "./push.module";
export { WebPushAdapter } from "./adapters";
export { WebNotificationChannelDriver } from "./channels";
export { WEB_PUSH_CONFIG } from "./constants";
export { urlB64ToUint8Array } from "./utils";
export type { IWebPushConfig, IWebPushSubscription } from "./interfaces";
