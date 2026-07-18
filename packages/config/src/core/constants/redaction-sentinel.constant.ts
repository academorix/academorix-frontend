/**
 * @file redaction-sentinel.constant.ts
 * @module @stackra/config/core/constants
 * @description Redaction sentinel emitted by `ConfigService.describe`
 *   for property paths matching a caller-supplied `redactedKeys` regex.
 *
 *   **Stackra addition** — not present in `@nestjs/config`. Kept as a
 *   named constant (rather than an inline string) so consumer tests
 *   can pin against it without a magic literal.
 */

/**
 * Fixed placeholder value substituted for sensitive values in
 * `ConfigService.describe` output.
 *
 * @example
 * ```typescript
 * const snapshot = config.describe({ redactedKeys: [/_SECRET$/] });
 * // snapshot['auth.jwt_secret'].value === CONFIG_REDACTION_SENTINEL
 * ```
 */
export const CONFIG_REDACTION_SENTINEL = "***REDACTED***" as const;
