/**
 * @file default-guard-priority.constants.ts
 * @module @stackra/routing/core/constants
 * @description Priority applied to guards when they are converted to
 *   middleware entries by `GuardAdapterService`. Higher priorities
 *   run first, and `1000` is higher than the default middleware
 *   priority (`100`) so guards get an early say on every request.
 */

/**
 * Default execution priority for a `@Guard`-decorated class.
 *
 * The guard-to-middleware adapter uses this value when the guard's
 * options don't specify an explicit priority. `1000` is the plan's
 * canonical value (§8) and is significantly higher than the default
 * middleware priority (`100`) so guards run before normal middleware.
 */
export const DEFAULT_GUARD_PRIORITY = 1000 as const;

/**
 * Default execution priority for a `@Middleware`-decorated class.
 *
 * Middleware without an explicit priority runs at `100`. The value
 * matches the ssr package's convention so ported middleware slots
 * into the routing pipeline without a priority shift.
 */
export const DEFAULT_MIDDLEWARE_PRIORITY = 100 as const;
