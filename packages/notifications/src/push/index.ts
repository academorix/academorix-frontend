/**
 * @file index.ts
 * @module @academorix/notifications/push
 *
 * @description
 * Public barrel for the Web Push subscription helpers.
 */

export {
  getExistingPushSubscription,
  isPushSupported,
  serializePushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "./push-subscription.util";
export type { SerializedPushSubscription, SubscribeToPushOptions } from "./push-subscription.util";
export { urlBase64ToUint8Array } from "./vapid.util";
