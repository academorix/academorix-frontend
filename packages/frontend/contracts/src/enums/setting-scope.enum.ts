/**
 * @file setting-scope.enum.ts
 * @module @stackra/contracts/enums
 * @description Hierarchy scope for settings groups.
 *
 *   Determines how a group participates in the resolution chain:
 *   `system` → `tenant` → `user`. The server resolves the effective
 *   value using this ordering; the client sends optional tenant/user
 *   hints via query params when overriding the auth-context default.
 */

/** Settings hierarchy scope levels. */
export enum SettingScope {
  /** Single global instance — no tenant or user overrides. */
  System = "system",
  /** Supports tenant-level overrides via `tenant_{id}.{group}` keys. */
  Tenant = "tenant",
  /** Supports user-level preferences via `user_{id}.{group}` keys. */
  User = "user",
}
