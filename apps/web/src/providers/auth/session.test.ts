/**
 * @file session.test.ts
 * @module providers/auth/session.test
 *
 * @description
 * Unit tests for the in-memory session cache: permission lookups
 * ({@link hasPermission} incl. the `"*"` superuser wildcard), feature-flag
 * checks ({@link hasFeature} incl. the fail-open bootstrap behaviour), and the
 * raw {@link getCurrentPermissions} accessor. Identity is reset to `null` in
 * `beforeEach` so each test controls the cached state.
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  getCurrentPermissions,
  hasFeature,
  hasPermission,
  setCurrentIdentity,
} from "@/providers/auth/session";
import { makeIdentity } from "@/test/fixtures";

beforeEach(() => {
  setCurrentIdentity(null);
});

describe("hasPermission", () => {
  it("grants everything for the '*' wildcard", () => {
    setCurrentIdentity(makeIdentity({ permissions: ["*"] }));

    expect(hasPermission("athletes.create")).toBe(true);
    expect(hasPermission("literally.anything")).toBe(true);
  });

  it("returns true for an exact match", () => {
    setCurrentIdentity(makeIdentity({ permissions: ["athletes.viewAny", "courses.update"] }));

    expect(hasPermission("courses.update")).toBe(true);
  });

  it("returns false for a permission the identity lacks", () => {
    setCurrentIdentity(makeIdentity({ permissions: ["athletes.viewAny"] }));

    expect(hasPermission("invoices.viewAny")).toBe(false);
  });

  it("returns false when signed out", () => {
    expect(hasPermission("athletes.viewAny")).toBe(false);
  });
});

describe("getCurrentPermissions", () => {
  it("returns the cached identity's permissions", () => {
    setCurrentIdentity(makeIdentity({ permissions: ["a.read", "b.write"] }));

    expect(getCurrentPermissions()).toEqual(["a.read", "b.write"]);
  });

  it("returns an empty array when signed out", () => {
    expect(getCurrentPermissions()).toEqual([]);
  });
});

describe("hasFeature", () => {
  it("returns true when no feature is requested", () => {
    setCurrentIdentity(makeIdentity({ features: ["billing"] }));

    expect(hasFeature()).toBe(true);
    expect(hasFeature(undefined)).toBe(true);
  });

  it("fails open when the feature set is empty", () => {
    setCurrentIdentity(makeIdentity({ features: [] }));

    expect(hasFeature("billing")).toBe(true);
  });

  it("returns true for an enabled feature and false for an absent one", () => {
    setCurrentIdentity(makeIdentity({ features: ["billing", "messaging"] }));

    expect(hasFeature("billing")).toBe(true);
    expect(hasFeature("analytics")).toBe(false);
  });

  it("fails open when signed out (no feature set known)", () => {
    expect(hasFeature("billing")).toBe(true);
  });
});
