/**
 * @file tokens.constant.ts
 * @module @stackra/coordinator/core/constants
 * @description DI tokens consumed by the coordinator module. Cross-
 *   package tokens (`COORDINATOR_CONFIG`, `TAB_COORDINATOR`) live in
 *   `@stackra/contracts`; the package-internal `TAB_LOCK_MANAGER`
 *   stays here.
 */

/**
 * Token under which the `LockManager` singleton is registered.
 *
 * @internal — consumed only by the coordinator package itself. If a
 *   cross-package consumer ever appears, promote this to
 *   `@stackra/contracts`.
 */
export const TAB_LOCK_MANAGER = Symbol.for('TAB_LOCK_MANAGER');
