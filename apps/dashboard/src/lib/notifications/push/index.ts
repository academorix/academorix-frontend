/**
 * @file index.ts
 * @module notifications/push
 *
 * @description
 * Public barrel for the Web Push scaffolding. Consumers import the
 * outcome type + entrypoint from here so the internal file split can
 * evolve without touching callers.
 */

export { PUSH_SUBSCRIBE_ENDPOINT, registerPush } from "./register-push";
export type { RegisterPushOutcome } from "./register-push";
export { fetchVapidPublicKey, VAPID_ENDPOINT } from "./vapid-provider";
