/**
 * @file should-enable-devtools.util.ts
 * @module @stackra/devtools/core/utils
 * @description Resolves the effective `enabled` flag for
 *   `IDevtoolsModuleOptions`.
 *
 *   The devtools shell is disabled in production by default —
 *   `Env.isProduction()` (from `@stackra/support`) is the single
 *   source of truth for the environment check. The user may
 *   override with an explicit boolean; when they do, we honour it
 *   verbatim so a staging build can flip the shell on even when
 *   `NODE_ENV === 'production'`.
 */

import { Env } from "@stackra/support";

/**
 * Resolve the effective `enabled` flag.
 *
 * @param explicit - The user-supplied override, or `undefined` when
 *   the field was left unset.
 * @returns `true` when the shell should mount, `false` otherwise.
 *
 * Precedence:
 *   1. `explicit` — when defined (`true` / `false`), wins.
 *   2. Default — `!Env.isProduction()` (dev/test on, prod off).
 *
 * @example
 * ```typescript
 * shouldEnableDevtools();        // false in prod, true otherwise
 * shouldEnableDevtools(true);    // true (staging override)
 * shouldEnableDevtools(false);   // false (dev opt-out)
 * ```
 */
export function shouldEnableDevtools(explicit?: boolean): boolean {
  // Explicit override wins — even in production, a caller may
  // choose to enable the shell (e.g. an ability-gated staging
  // build). `undefined` means "no opinion, use the default".
  if (typeof explicit === "boolean") return explicit;
  return !Env.isProduction();
}
