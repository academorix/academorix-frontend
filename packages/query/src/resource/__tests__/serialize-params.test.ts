/**
 * @file serialize-params.test.ts
 * @module @academorix/query/resource/__tests__/serialize-params.test
 *
 * @description
 * Unit tests for {@link serializeListParams}. Covers:
 *
 *  - Simple flat params (`page`, `per_page`, `sort`).
 *  - Nested `filter` bracket-syntax expansion.
 *  - Array values comma-joined.
 *  - `undefined` / `null` values skipped.
 *  - Empty arrays skipped.
 *  - `undefined` input → empty params.
 */

import { describe, expect, it } from "vitest";

import { serializeListParams } from "../serialize-params.util";

describe("serializeListParams", () => {
  it("returns an empty URLSearchParams when called with undefined", () => {
    expect(serializeListParams(undefined).toString()).toBe("");
  });

  it("returns an empty URLSearchParams for an empty object", () => {
    expect(serializeListParams({}).toString()).toBe("");
  });

  it("serialises simple flat params", () => {
    const params = serializeListParams({ page: 2, per_page: 25, sort: "-created_at" });

    expect(params.get("page")).toBe("2");
    expect(params.get("per_page")).toBe("25");
    expect(params.get("sort")).toBe("-created_at");
  });

  it("expands a nested filter object into bracket-syntax keys", () => {
    const params = serializeListParams({
      filter: { status: "active", age: { gte: 18 } },
    });

    expect(params.get("filter[status]")).toBe("active");
    expect(params.get("filter[age][gte]")).toBe("18");
  });

  it("recurses through arbitrarily nested filter objects", () => {
    const params = serializeListParams({
      filter: {
        athlete: {
          team: {
            branch: "riverside",
          },
        },
      },
    });

    expect(params.get("filter[athlete][team][branch]")).toBe("riverside");
  });

  it("comma-joins array values", () => {
    const params = serializeListParams({
      filter: { branch: ["a", "b", "c"] },
    });

    expect(params.get("filter[branch]")).toBe("a,b,c");
  });

  it("stringifies primitives inside arrays (numbers, booleans)", () => {
    const params = serializeListParams({
      filter: { ids: [1, 2, 3] },
    });

    expect(params.get("filter[ids]")).toBe("1,2,3");
  });

  it("skips undefined values", () => {
    const params = serializeListParams({
      page: 1,
      sort: undefined,
      filter: { status: undefined },
    });

    expect(params.get("page")).toBe("1");
    expect(params.has("sort")).toBe(false);
    expect(params.has("filter[status]")).toBe(false);
  });

  it("skips null values", () => {
    const params = serializeListParams({
      filter: { status: null, active: null },
    });

    expect(params.has("filter[status]")).toBe(false);
    expect(params.has("filter[active]")).toBe(false);
  });

  it("skips empty arrays", () => {
    const params = serializeListParams({
      filter: { branch: [] },
    });

    expect(params.has("filter[branch]")).toBe(false);
  });

  it("stringifies booleans", () => {
    const params = serializeListParams({
      filter: { active: true, archived: false },
    });

    expect(params.get("filter[active]")).toBe("true");
    expect(params.get("filter[archived]")).toBe("false");
  });

  it("combines top-level + nested params in one URLSearchParams instance", () => {
    const params = serializeListParams({
      page: 1,
      per_page: 25,
      include: "branch,team",
      filter: { status: "active", age: { gte: 18 } },
    });

    expect(params.get("page")).toBe("1");
    expect(params.get("per_page")).toBe("25");
    expect(params.get("include")).toBe("branch,team");
    expect(params.get("filter[status]")).toBe("active");
    expect(params.get("filter[age][gte]")).toBe("18");
  });
});
