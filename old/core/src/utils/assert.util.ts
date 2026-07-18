/**
 * @file assert.util.ts
 * @module @academorix/core/utils/assert.util
 *
 * @description
 * Runtime + compile-time assertion helpers shared across the workspace.
 *
 * These are intentionally tiny — heavier assertion machinery (schema
 * validation, environment-specific asserts) lives in the packages that
 * need it (e.g. Zod in `@academorix/core/env`).
 */

/**
 * Exhaustiveness check for switch statements over discriminated unions.
 *
 * Placing `assertNever(value)` in the `default` branch causes TypeScript
 * to flag the switch as non-exhaustive if a new variant is added but
 * not handled.
 *
 * @param value - The impossible-to-reach value. Typed as `never` so the
 *   compiler enforces exhaustiveness.
 * @throws Error at runtime if reached (defensive — should be dead code).
 *
 * @example
 * ```ts
 * type Status = "pending" | "active" | "cancelled";
 *
 * function describe(status: Status): string {
 *   switch (status) {
 *     case "pending":   return "Waiting…";
 *     case "active":    return "Live";
 *     case "cancelled": return "Cancelled";
 *     default:          return assertNever(status);
 *   }
 * }
 * ```
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

/**
 * Narrows a nullable value to non-null with an explicit error path.
 *
 * `T | null | undefined` → `T`. Prefer over `!` non-null assertions so
 * the failure message is actionable if the invariant is violated.
 *
 * @param value - The nullable value.
 * @param message - Message included in the error when the value is nullish.
 * @throws Error when `value` is null or undefined.
 *
 * @example
 * ```ts
 * const el = assertDefined(
 *   document.getElementById("root"),
 *   "Missing #root — has the SPA mounted?",
 * );
 * ```
 */
export function assertDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
}
