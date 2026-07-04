/**
 * @file map-identity.test.ts
 * @module providers/auth/map-identity.test
 *
 * @description
 * Unit tests for the pure identity mappers: {@link computeInitials} (first+last
 * initials, display-name fallback, and the `"?"` last resort) and
 * {@link toIdentity} (name resolution, initials, and the `tenants`/`scopes`
 * defaults applied when the server omits them).
 */

import { describe, expect, it } from "vitest";

import { computeInitials, toIdentity } from "@/providers/auth/map-identity";
import { makeAuthUser, makeUserProfile } from "@/test/fixtures";

describe("computeInitials", () => {
  it("uses the first letters of the first and last name", () => {
    expect(computeInitials(makeUserProfile({ first_name: "Jane", last_name: "Doe" }))).toBe("JD");
  });

  it("uppercases the derived initials", () => {
    expect(computeInitials(makeUserProfile({ first_name: "ada", last_name: "byron" }))).toBe("AB");
  });

  it("falls back to the display name's first character when name parts are blank", () => {
    expect(
      computeInitials(makeUserProfile({ first_name: "", last_name: "", display_name: "support" })),
    ).toBe("S");
  });

  it("ignores whitespace-only name parts before falling back", () => {
    expect(
      computeInitials(makeUserProfile({ first_name: "   ", last_name: "  ", display_name: "Ops" })),
    ).toBe("O");
  });

  it("returns '?' when there is nothing to derive initials from", () => {
    expect(
      computeInitials(makeUserProfile({ first_name: "", last_name: "", display_name: "" })),
    ).toBe("?");
  });
});

describe("toIdentity", () => {
  it("condenses an AuthUser into the UI identity", () => {
    const user = makeAuthUser({
      id: "u-42",
      email: "coach@club.io",
      profile: makeUserProfile({
        first_name: "Sam",
        last_name: "Lee",
        display_name: "Coach Sam",
        avatar_url: "a.png",
      }),
      roles: ["head_coach"],
      permissions: ["athletes.viewAny"],
      features: ["billing"],
    });

    expect(toIdentity(user)).toMatchObject({
      id: "u-42",
      name: "Coach Sam",
      email: "coach@club.io",
      avatar_url: "a.png",
      initials: "SL",
      roles: ["head_coach"],
      permissions: ["athletes.viewAny"],
      features: ["billing"],
    });
  });

  it("uses 'first last' when there is no display name", () => {
    const user = makeAuthUser({
      profile: makeUserProfile({ first_name: "Sam", last_name: "Lee", display_name: "" }),
    });

    expect(toIdentity(user).name).toBe("Sam Lee");
  });

  it("falls back to the email when no name is available", () => {
    const user = makeAuthUser({
      email: "nameless@club.io",
      profile: makeUserProfile({ first_name: "", last_name: "", display_name: "" }),
    });

    expect(toIdentity(user).name).toBe("nameless@club.io");
  });

  it("defaults tenants to the single active tenant when the server omits them", () => {
    const user = makeAuthUser(); // `tenants` intentionally undefined

    expect(toIdentity(user).tenants).toEqual([user.tenant]);
  });

  it("defaults scopes to empty lists when the server omits them", () => {
    expect(toIdentity(makeAuthUser()).scopes).toEqual({
      organizations: [],
      branches: [],
      seasons: [],
    });
  });

  it("passes provided tenants and scopes through", () => {
    const other = { id: "t-2", slug: "beta", name: "Beta Club", business_type: "club" as const };
    const scopes = {
      organizations: [{ id: "o1", name: "Org 1" }],
      branches: [{ id: "b1", name: "Branch 1", organization_id: "o1" }],
      seasons: [{ id: "s1", name: "2025", is_current: true }],
    };

    const identity = toIdentity(makeAuthUser({ tenants: [other], scopes }));

    expect(identity.tenants).toEqual([other]);
    expect(identity.scopes).toEqual(scopes);
  });
});
