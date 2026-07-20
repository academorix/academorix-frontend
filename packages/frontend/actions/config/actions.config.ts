/**
 * @file actions.config.ts
 * @module @stackra/actions/config
 * @description Application-level action-bus configuration.
 *   Consumed by `ActionsModule.forRoot()` at bootstrap.
 */

import { defineConfig } from "@stackra/actions";

export const actionsConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Permission Resolver
  |--------------------------------------------------------------------------
  |
  | An optional permission resolver bound to the `PERMISSION_RESOLVER` token.
  | The built-in `AuthorizeMiddleware` calls it with `(permission, context)`
  | whenever a descriptor carries a `permission` field. Wire your auth
  | service in when you need real authorization checks.
  |
  | Example:
  |   permissionResolver: async (permission, ctx) => authService.can(permission),
  |
  */
  // permissionResolver: undefined,

  /*
  |--------------------------------------------------------------------------
  | Extra Middleware
  |--------------------------------------------------------------------------
  |
  | Middleware appended AFTER the built-in `AuthorizeMiddleware` +
  | `LogMiddleware` + `TraceMiddleware` trio. Use for audit trails,
  | feature-flag gates, action-level rate limiting, etc.
  |
  */
  middleware: [],
});
