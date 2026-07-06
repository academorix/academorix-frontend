/**
 * @file password-policy.ts
 * @module providers/auth/password-policy
 *
 * @description
 * Mirrors the backend's password policy (`Academorix\User\Support\PasswordPolicy`)
 * so the SPA can:
 *
 * - **Validate optimistically** before hitting `POST /auth/register` /
 *   `.../reset-password` — no wasted network round-trips on obvious failures.
 * - **Show live rule feedback** as the user types (checklist under the field).
 *
 * The backend is still the source of truth; a `422` from any endpoint remains
 * the authoritative rejection path. Keep this file in sync with the backend's
 * policy every time the min length / rule set changes (or, later, expose it as
 * a `GET /api/v1/config/password-policy` endpoint per gap G13).
 */

/** A single password rule with a human-readable label and predicate. */
export interface PasswordRule {
  /** Stable id used as a `React key` in a checklist. */
  id: string;
  /** Short label rendered in the checklist. */
  label: string;
  /** Predicate that returns `true` when the rule is satisfied. */
  test: (password: string) => boolean;
}

/**
 * The minimum password length enforced by the backend. Mirrors
 * `PasswordPolicy::MIN_LENGTH` (12 today, env-driven server-side).
 */
export const PASSWORD_MIN_LENGTH = 12;

/**
 * The rule set the backend enforces (min length + at least one letter + at
 * least one digit + not compromised — the last one is server-only since it
 * relies on the HaveIBeenPwned check).
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "min-length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "has-letter",
    label: "Contains at least one letter",
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    id: "has-digit",
    label: "Contains at least one digit",
    test: (password) => /\d/.test(password),
  },
];

/** Result of {@link validatePassword}. */
export interface PasswordValidationResult {
  /** Whether every rule the client can check passes. */
  isValid: boolean;
  /** Rule ids that failed. */
  failedRuleIds: string[];
}

/**
 * Runs every client-side rule against `password`. Returns a result summarising
 * pass/fail so the UI can render a live checklist and disable submit.
 *
 * @param password - The password to validate.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const failedRuleIds: string[] = [];

  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      failedRuleIds.push(rule.id);
    }
  }

  return { isValid: failedRuleIds.length === 0, failedRuleIds };
}
