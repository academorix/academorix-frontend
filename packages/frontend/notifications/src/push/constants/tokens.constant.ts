/**
 * @file tokens.constant.ts
 * @module @stackra/notifications/push/constants
 * @description DI tokens for the Web Push subpath.
 *
 *   Only the config token is owned by this subpath. The push
 *   subscription manager + platform adapter tokens live in
 *   `@stackra/notifications/core/constants` because they are
 *   platform-agnostic — the core module registers the manager
 *   and every platform module binds an adapter under the same
 *   {@link PUSH_SUBSCRIPTION_ADAPTER} token.
 */

/** DI token for the resolved Web Push configuration. */
export const WEB_PUSH_CONFIG = Symbol.for("NOTIFICATIONS_WEB_PUSH_CONFIG");
