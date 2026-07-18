/**
 * @file define-flags.util.ts
 * @module @academorix/feature-flags/config/define-flags.util
 *
 * @description
 * Typed passthrough for feature-flag declarations. Freezes the input so
 * accidental mutation throws at runtime, and preserves the literal type
 * so downstream `useFeature("<key>")` calls autocomplete on the keys.
 *
 * The generic `TFlags extends Record<string, boolean>` ensures every
 * value is a boolean at compile time. If we need string / enum / number
 * flags in the future we can widen this — for now, keep it simple:
 * flags are on/off.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/config/features.config.ts
 * import { defineFlags, envFlag } from "@academorix/feature-flags";
 *
 * export const featureFlags = defineFlags({
 *   dashboardV2: true,
 *   attendanceAlerts: envFlag("VITE_FLAG_ATTENDANCE_ALERTS", false),
 *   safeguardingChecks: envFlag("VITE_FLAG_SAFEGUARDING_CHECKS", true),
 * });
 *
 * export type FeatureFlag = keyof typeof featureFlags;
 * ```
 */

/**
 * Ties a feature-flag literal to `Record<string, boolean>` and freezes
 * the result.
 *
 * @typeParam TFlags - Inferred from the input; every value must be a
 *   boolean.
 * @param flags - The flag literal.
 * @returns The same literal, frozen and typed.
 */
export function defineFlags<TFlags extends Record<string, boolean>>(
  flags: TFlags,
): Readonly<TFlags> {
  return Object.freeze(flags);
}
