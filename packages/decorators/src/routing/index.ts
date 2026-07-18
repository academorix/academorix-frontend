/**
 * @file index.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * Public API barrel for the routing-domain decorators.
 */

export { Guard, guardMetadata } from "./guard.decorator";
export { Middleware, middlewareMetadata } from "./middleware.decorator";
export { GlobalGuard } from "./global-guard.decorator";
export { GlobalMiddleware } from "./global-middleware.decorator";
export {
  RequireRole,
  requireRoleMetadata,
  type IRequireRoleOptions,
} from "./require-role.decorator";
export {
  RequirePermission,
  requirePermissionMetadata,
  type IRequirePermissionOptions,
} from "./require-permission.decorator";
export {
  RequireAny,
  requireAnyMetadata,
  type IRequireAnyOptions,
  type IRequireAnyClause,
} from "./require-any.decorator";
