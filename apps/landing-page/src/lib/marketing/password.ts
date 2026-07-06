/**
 * @file password.ts
 * @module lib/marketing/password
 *
 * @description
 * Client-side password rule resolver. Server Component fetches the JSON via
 * `getPasswordRules()`, then passes the shape to Client Components; this
 * module turns each JSON rule into a runtime predicate suitable for a live
 * checklist.
 *
 * The JSON encodes each rule's predicate as either:
 *
 *   - `"min_length"` — a length threshold from the `min` field
 *   - A regex source string (e.g. `"[a-zA-Z]"` or `"\\d"`)
 *
 * This resolver compiles those into `RegExp` / length checks lazily.
 */

import type { PasswordRuleData } from "@/lib/types";

/** A single runtime password rule with a live predicate. */
export interface CompiledPasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/**
 * Compiles the JSON-declared rule set into runtime predicates. Regex sources
 * that fail to compile are dropped with a console warning — better than
 * blowing up the whole form.
 */
export function compilePasswordRules(
  rules: readonly PasswordRuleData[],
): readonly CompiledPasswordRule[] {
  return rules
    .map((rule): CompiledPasswordRule | null => {
      if (rule.test === "min_length" && typeof rule.min === "number") {
        const min = rule.min;

        return {
          id: rule.id,
          label: rule.label,
          test: (password) => password.length >= min,
        };
      }

      try {
        const pattern = new RegExp(rule.test);

        return {
          id: rule.id,
          label: rule.label,
          test: (password) => pattern.test(password),
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Password rule "${rule.id}" has an invalid regex: ${rule.test}`, error);

        return null;
      }
    })
    .filter((rule): rule is CompiledPasswordRule => rule !== null);
}

/** Aggregate validation result. */
export interface PasswordValidationResult {
  isValid: boolean;
  failedRuleIds: string[];
}

/** Runs every compiled rule against `password` and returns the aggregate. */
export function validatePassword(
  password: string,
  rules: readonly CompiledPasswordRule[],
): PasswordValidationResult {
  const failedRuleIds: string[] = [];

  for (const rule of rules) {
    if (!rule.test(password)) {
      failedRuleIds.push(rule.id);
    }
  }

  return { isValid: failedRuleIds.length === 0, failedRuleIds };
}
