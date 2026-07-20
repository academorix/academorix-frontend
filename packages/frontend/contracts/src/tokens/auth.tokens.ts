/**
 * @file auth.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens + metadata keys for the authentication subsystem.
 *
 *   The main service tokens (`AUTH_CONFIG`, `AUTH_SERVICE`, etc.) let
 *   any package inject the auth surface without pulling in the
 *   `@stackra/auth` runtime.
 *
 *   The `*_METADATA` symbols are keys used by `@stackra/auth`'s
 *   decorators (`@UseGuards`, `@RequireRole`, `@RequirePermission`) to
 *   stamp guard / role / permission requirements onto route classes.
 *   Consumers (the SSR router, guard invokers, discovery loaders) read
 *   the metadata via `getMetadata(key, target)`.
 */

// ─── Service tokens ──────────────────────────────────────────────────

/** Token for the merged auth module configuration. */
export const AUTH_CONFIG = Symbol.for("AUTH_CONFIG");

/** Token for the `IAuthService` — login / logout / register / MFA / etc. */
export const AUTH_SERVICE = Symbol.for("AUTH_SERVICE");

/** Token for the `ISessionService` — session lifecycle + device list. */
export const SESSION_SERVICE = Symbol.for("SESSION_SERVICE");

/** Token for the `ISecurityService` — post-auth security checks. */
export const SECURITY_SERVICE = Symbol.for("SECURITY_SERVICE");

/** Token for the `IAccessControlService` — resource/action permission checks. */
export const ACCESS_CONTROL_SERVICE = Symbol.for("ACCESS_CONTROL_SERVICE");

/**
 * Token for the pluggable token-storage adapter — persists the auth
 * token across page loads / app restarts. Implementations wrap
 * `localStorage` (web) or `SecureStore` (native).
 */
export const TOKEN_STORAGE = Symbol.for("TOKEN_STORAGE");

// ─── Route metadata keys ─────────────────────────────────────────────
//
// Each key is used exactly once — as the metadata slot on a route
// class — so `Symbol()` (not `Symbol.for(...)`) is the safe choice:
// two independent instantiations of the same file across module
// duplicates would then still resolve to distinct symbols instead of
// silently colliding through the global registry.

/** Metadata key holding the array of `Type<ICanActivate>` guards stamped by `@UseGuards(...)`. */
export const GUARDS_METADATA_KEY = Symbol("@stackra/auth:guards");

/** Metadata key holding the roles array stamped by `@RequireRole(...)`. */
export const REQUIRED_ROLES_METADATA = Symbol("@stackra/auth:required-roles");

/** Metadata key holding the `'all' | 'any'` operator paired with the roles list. */
export const ROLE_OPERATOR_METADATA = Symbol("@stackra/auth:role-operator");

/** Metadata key holding the resource name for `@RequirePermission({ resource, action })`. */
export const PERMISSION_RESOURCE_METADATA = Symbol("@stackra/auth:permission-resource");

/** Metadata key holding the action name for `@RequirePermission({ resource, action })`. */
export const PERMISSION_ACTION_METADATA = Symbol("@stackra/auth:permission-action");

/** Metadata key holding the permissions array for `@RequirePermission({ permissions })`. */
export const PERMISSIONS_METADATA = Symbol("@stackra/auth:permissions");

/** Metadata key holding the `'all' | 'any'` operator paired with the permissions list. */
export const PERMISSION_OPERATOR_METADATA = Symbol("@stackra/auth:permission-operator");
