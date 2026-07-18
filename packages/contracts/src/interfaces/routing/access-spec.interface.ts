/**
 * @file access-spec.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Sugar shape over the guards list — routes may declare
 *   `access: {roles, permissions}` instead of listing explicit
 *   `RoleGuard(...)` / `PermissionGuard(...)` calls.
 */

/**
 * Access-shortcut spec. The framework compiles this into the equivalent
 * `guards: [...]` list at `toRRv7Routes(...)` time.
 */
export interface IAccessSpec {
  /**
   * Required roles — user must have at least ONE of these.
   * (`RoleGuard(role)` semantics.)
   */
  readonly roles?: readonly string[];

  /**
   * Required permissions — user must have at least ONE of these.
   * (`PermissionGuard(permission)` semantics.)
   */
  readonly permissions?: readonly string[];
}
