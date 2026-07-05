/**
 * @file password-policy.test.ts
 * @module providers/auth/password-policy.test
 *
 * @description
 * Unit tests for the client-side password policy that mirrors the backend's
 * `PasswordPolicy` (min length + at least one letter + at least one digit).
 * Covers the shape of the exported rule set and each verdict path of
 * {@link validatePassword} — every rule fails, only min-length fails, only
 * has-digit fails, and the "all pass" happy path.
 */

import { describe, expect, it } from "vitest";

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
  validatePassword,
} from "@/providers/auth/password-policy";

describe("PASSWORD_RULES", () => {
  it("exposes exactly three rules: min-length, has-letter, has-digit", () => {
    expect(PASSWORD_RULES).toHaveLength(3);
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual([
      "min-length",
      "has-letter",
      "has-digit",
    ]);
  });

  it("uses the exported minimum length in the min-length label", () => {
    const rule = PASSWORD_RULES.find((entry) => entry.id === "min-length");

    expect(rule?.label).toContain(String(PASSWORD_MIN_LENGTH));
  });
});

describe("validatePassword", () => {
  it("fails every rule for an empty password", () => {
    const result = validatePassword("");

    expect(result.isValid).toBe(false);
    expect(result.failedRuleIds).toEqual(["min-length", "has-letter", "has-digit"]);
    expect(result.failedRuleIds).toHaveLength(3);
  });

  it("fails only min-length when the password is short but has letter + digit", () => {
    const result = validatePassword("short1");

    expect(result.isValid).toBe(false);
    expect(result.failedRuleIds).toEqual(["min-length"]);
  });

  it("fails only has-digit when the password is long enough with letters only", () => {
    // 12 letters, no digit.
    const result = validatePassword("abcdefghijkl");

    expect(result.isValid).toBe(false);
    expect(result.failedRuleIds).toEqual(["has-digit"]);
  });

  it("fails only has-letter when the password is long enough with digits only", () => {
    // 12 digits, no letter — a symmetric case that confirms has-letter is checked.
    const result = validatePassword("123456789012");

    expect(result.isValid).toBe(false);
    expect(result.failedRuleIds).toEqual(["has-letter"]);
  });

  it("passes every rule for a long, mixed password", () => {
    const result = validatePassword("password12345");

    expect(result.isValid).toBe(true);
    expect(result.failedRuleIds).toEqual([]);
  });

  it("accepts uppercase-only letters (the rule is case-insensitive)", () => {
    const result = validatePassword("PASSWORD12345");

    expect(result.isValid).toBe(true);
  });

  it("treats exactly PASSWORD_MIN_LENGTH characters as passing min-length", () => {
    const password = "a".repeat(PASSWORD_MIN_LENGTH - 1) + "1"; // length === min

    expect(password).toHaveLength(PASSWORD_MIN_LENGTH);
    expect(validatePassword(password).failedRuleIds).not.toContain("min-length");
  });
});
