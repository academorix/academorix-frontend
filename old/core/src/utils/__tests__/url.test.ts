/**
 * @file url.test.ts
 * @module @academorix/core/utils/__tests__/url.test
 *
 * @description
 * Tests for the tiny URL primitives — `trimTrailingSlash`,
 * `ensureLeadingSlash`, `joinUrl`. Each helper's whole contract is
 * a handful of string transforms; the value here is enumerating the
 * edge cases explicitly so future refactors can't quietly regress
 * a boundary.
 */

import { describe, expect, it } from "vitest";

import { ensureLeadingSlash, joinUrl, trimTrailingSlash } from "../url.util";

describe("trimTrailingSlash()", () => {
  it("removes a single trailing slash", () => {
    expect(trimTrailingSlash("https://x.com/")).toBe("https://x.com");
  });

  it("removes multiple trailing slashes", () => {
    expect(trimTrailingSlash("https://x.com///")).toBe("https://x.com");
  });

  it("leaves a value without a trailing slash unchanged", () => {
    expect(trimTrailingSlash("https://x.com")).toBe("https://x.com");
  });

  it("leaves a bare path unchanged", () => {
    expect(trimTrailingSlash("api/users")).toBe("api/users");
  });

  it("trims only trailing slashes, never leading", () => {
    expect(trimTrailingSlash("/api/users/")).toBe("/api/users");
  });

  it("returns an empty string when the input is only slashes", () => {
    expect(trimTrailingSlash("///")).toBe("");
  });

  it("returns an empty string for the empty string", () => {
    expect(trimTrailingSlash("")).toBe("");
  });
});

describe("ensureLeadingSlash()", () => {
  it("adds a leading slash when the path has none", () => {
    expect(ensureLeadingSlash("path")).toBe("/path");
  });

  it("keeps a single leading slash intact", () => {
    expect(ensureLeadingSlash("/path")).toBe("/path");
  });

  it("collapses multiple leading slashes into one", () => {
    expect(ensureLeadingSlash("///path")).toBe("/path");
  });

  it("returns just '/' for an empty input", () => {
    expect(ensureLeadingSlash("")).toBe("/");
  });

  it("returns just '/' for an input of only slashes", () => {
    expect(ensureLeadingSlash("////")).toBe("/");
  });

  it("preserves query strings", () => {
    expect(ensureLeadingSlash("path?q=1")).toBe("/path?q=1");
  });
});

describe("joinUrl()", () => {
  it("joins a trailing-slash base with a leading-slash path (single boundary slash)", () => {
    expect(joinUrl("https://x.com/", "/api/users")).toBe("https://x.com/api/users");
  });

  it("joins a non-slash base with a non-slash path", () => {
    expect(joinUrl("https://x.com/v1", "users")).toBe("https://x.com/v1/users");
  });

  it("normalises a trailing-slash base with a leading-slash path", () => {
    expect(joinUrl("https://x.com/v1/", "/users")).toBe("https://x.com/v1/users");
  });

  it("collapses excessive slashes at the boundary", () => {
    expect(joinUrl("https://x.com//", "///users")).toBe("https://x.com/users");
  });

  it("handles a bare origin with a bare path", () => {
    expect(joinUrl("https://x.com", "users")).toBe("https://x.com/users");
  });

  it("handles relative bases as well", () => {
    expect(joinUrl("/api", "users")).toBe("/api/users");
  });
});
