/**
 * @file interpolate.util.ts
 * @module @stackra/i18n/core/utils
 * @description String interpolation with variable substitution and transform pipes.
 *   Handles `{{variable}}` placeholders and `{{ name | uppercase }}` pipes.
 */

import { Str } from "@stackra/support";

import {
  PIPE_SEPARATOR,
  TRANSFORM_PIPES,
  DEFAULT_INTERPOLATION_PREFIX,
  DEFAULT_INTERPOLATION_SUFFIX,
} from "../constants";

// ============================================================================
// Transform Pipe Functions
// ============================================================================

const PIPE_FNS: Record<string, (value: string) => string> = {
  [TRANSFORM_PIPES.UPPERCASE]: (v) => Str.upper(v),
  [TRANSFORM_PIPES.LOWERCASE]: (v) => Str.lower(v),
  // `ucfirst` uppercases the first character; the remainder is
  // lowercased so "hELLO" → "Hello" (matching the CAPITALIZE
  // convention).
  [TRANSFORM_PIPES.CAPITALIZE]: (v) => (v.length > 0 ? Str.ucfirst(Str.lower(v)) : v),
};

// ============================================================================
// Interpolation
// ============================================================================

/**
 * Interpolate a translation string with variable substitution and transform pipes.
 *
 * Steps:
 * 1. Process `{{ value | pipe }}` expressions (transform pipes)
 * 2. Replace `{{key}}` placeholders with arg values
 *
 * @param template - The raw translation string
 * @param args - Interpolation arguments (object with key-value pairs)
 * @param prefix - Opening delimiter (default: `{{`)
 * @param suffix - Closing delimiter (default: `}}`)
 * @returns The interpolated string
 *
 * @example
 * ```typescript
 * interpolate("Hello {{name}}!", { name: "World" });
 * // "Hello World!"
 *
 * interpolate("Hello {{ name | uppercase }}!", { name: "world" });
 * // "Hello WORLD!"
 * ```
 */
export function interpolate(
  template: string,
  args?: Record<string, unknown>,
  prefix: string = DEFAULT_INTERPOLATION_PREFIX,
  suffix: string = DEFAULT_INTERPOLATION_SUFFIX,
): string {
  if (!args || !template) return template;

  // Escape regex special chars in prefix/suffix
  const escapedPrefix = escapeRegex(prefix);
  const escapedSuffix = escapeRegex(suffix);

  // Match {{ expression }} — supports pipes
  const regex = new RegExp(`${escapedPrefix}\\s*([^}]+?)\\s*${escapedSuffix}`, "g");

  return template.replace(regex, (_match, rawExpression: string) => {
    const parts = rawExpression
      .split(PIPE_SEPARATOR)
      .map((p) => Str.trim(p))
      .filter(Boolean);

    if (parts.length === 0) return _match;

    const argPath = parts[0]!;
    const transforms = parts.slice(1);

    // Resolve value from args (supports dot-path: "user.name")
    let value = resolveArgValue(args, argPath);

    if (value === undefined || value === null) return _match;

    let strValue = String(value);

    // Apply transform pipes
    for (const pipeName of transforms) {
      const fn = PIPE_FNS[Str.lower(pipeName)];
      if (fn) strValue = fn(strValue);
    }

    return strValue;
  });
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Resolve a value from args by dot-path.
 */
function resolveArgValue(args: Record<string, unknown>, path: string): unknown {
  if (path in args) return args[path];

  // Dot-path traversal
  const segments = path.split(".");
  let current: unknown = args;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
