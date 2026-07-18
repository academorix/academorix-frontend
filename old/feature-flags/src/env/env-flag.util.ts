/**
 * @file env-flag.util.ts
 * @module @academorix/feature-flags/env/env-flag.util
 *
 * @description
 * Boolean-typed env-var reader specialized for feature flags. Thin
 * wrapper over `@academorix/core/env`'s `env<T>()` primitive so
 * apps can wire environment overrides into `defineFlags()` calls at
 * boot time.
 *
 * ## Behaviour
 *
 * When the env var is present:
 *   - `"true"`, `"1"`, `"yes"`, `"on"` (case-insensitive) → `true`.
 *   - Anything else → `false`.
 *
 * When the env var is absent (or literally `""` / `"undefined"` /
 * `"null"`) → the caller-provided `defaultValue`.
 *
 * ## Build-time vs runtime
 *
 * Vite inlines `import.meta.env.VITE_FOO` at build time — flipping a
 * flag at runtime requires a new build. For deploy-time toggles
 * that's usually what you want (auditable, atomic). For genuinely
 * dynamic toggles (per-user experiments), pair `defineFlags` with the
 * runtime `<FeatureFlagsProvider overrides={...}>` prop.
 *
 * @example
 * ```ts
 * import { defineFlags, envFlag } from "@academorix/feature-flags";
 *
 * export const flags = defineFlags({
 *   // Default off — env can force on for staging: VITE_FLAG_NEW_HOME=true.
 *   newHome: envFlag("VITE_FLAG_NEW_HOME", false),
 *   // Default on — env can force off for the bug-report demo:
 *   //   VITE_FLAG_ANALYTICS=false.
 *   analytics: envFlag("VITE_FLAG_ANALYTICS", true),
 * });
 * ```
 */

import { env } from "@academorix/core/env";

/**
 * Reads a boolean env var with a fallback. Uses the auto-coercion path
 * of `@academorix/core/env`'s `env<T>()` — no Zod schema needed for
 * booleans.
 *
 * @param key - The env var name (must be a public prefix per build tool).
 * @param defaultValue - Fallback returned when the var is absent.
 */
export function envFlag(key: string, defaultValue: boolean): boolean {
  return env(key, defaultValue);
}
