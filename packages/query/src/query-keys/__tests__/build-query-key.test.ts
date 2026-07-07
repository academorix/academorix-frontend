/**
 * @file build-query-key.test.ts
 * @module @academorix/query/query-keys/__tests__/build-query-key.test
 *
 * @description
 * Unit tests for the canonical query-key builders. Every hook this
 * package generates threads keys through these helpers, so any
 * regression here manifests as duplicate cache entries or missed
 * invalidations downstream.
 *
 * Covered:
 *
 *  - `buildQueryKey` — assembles `[prefix, path, op, ...params]`.
 *  - `listKey` — with and without params.
 *  - `oneKey` — string coercion so `"1"` and `1` collapse.
 *  - `manyKey` — sort stability so `[1, 2]` and `[2, 1]` collapse.
 *  - `DEFAULT_QUERY_KEY_PREFIX` — sanity.
 */

import { describe, expect, it } from "vitest";

import {
  buildQueryKey,
  DEFAULT_QUERY_KEY_PREFIX,
  listKey,
  manyKey,
  oneKey,
} from "../build-query-key.util";

const PREFIX = DEFAULT_QUERY_KEY_PREFIX;

describe("DEFAULT_QUERY_KEY_PREFIX", () => {
  it("is the workspace namespace `@academorix`", () => {
    expect(DEFAULT_QUERY_KEY_PREFIX).toBe("@academorix");
  });
});

describe("buildQueryKey", () => {
  it("assembles [prefix, path, operation, ...params]", () => {
    expect(buildQueryKey(PREFIX, "students", "list")).toEqual([PREFIX, "students", "list"]);
    expect(buildQueryKey(PREFIX, "students", "one", "u-1")).toEqual([
      PREFIX,
      "students",
      "one",
      "u-1",
    ]);
    expect(buildQueryKey(PREFIX, "students", "many", ["a", "b"])).toEqual([
      PREFIX,
      "students",
      "many",
      ["a", "b"],
    ]);
  });
});

describe("listKey", () => {
  it("omits the params slot when no params are provided", () => {
    expect(listKey(PREFIX, "students")).toEqual([PREFIX, "students", "list"]);
  });

  it("appends the params object when provided", () => {
    const params = { page: 1, per_page: 25 };

    expect(listKey(PREFIX, "students", params)).toEqual([PREFIX, "students", "list", params]);
  });

  it("produces different keys for different params (React Query hashes the tail)", () => {
    const a = listKey(PREFIX, "students", { page: 1 });
    const b = listKey(PREFIX, "students", { page: 2 });

    // Deep-equal check via JSON so we don't rely on referential identity.
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe("oneKey", () => {
  it('coerces numeric ids to strings so `1` and `"1"` share a cache entry', () => {
    const stringKey = oneKey(PREFIX, "students", "1");
    const numberKey = oneKey(PREFIX, "students", 1);

    expect(stringKey).toEqual(numberKey);
    expect(stringKey).toEqual([PREFIX, "students", "one", "1"]);
  });

  it("preserves UUID strings verbatim", () => {
    expect(oneKey(PREFIX, "students", "a1b2-c3")).toEqual([PREFIX, "students", "one", "a1b2-c3"]);
  });
});

describe("manyKey", () => {
  it("sorts the ids so [1, 2] and [2, 1] collapse to the same key", () => {
    const forwards = manyKey(PREFIX, "students", [1, 2]);
    const backwards = manyKey(PREFIX, "students", [2, 1]);

    expect(forwards).toEqual(backwards);
    expect(forwards).toEqual([PREFIX, "students", "many", ["1", "2"]]);
  });

  it("coerces every id to string before sorting (string + number collapse)", () => {
    expect(manyKey(PREFIX, "students", [1, "2", 3])).toEqual([
      PREFIX,
      "students",
      "many",
      ["1", "2", "3"],
    ]);
  });

  it("does not mutate the caller's ids array", () => {
    const ids = [3, 1, 2];

    manyKey(PREFIX, "students", ids);

    expect(ids).toEqual([3, 1, 2]);
  });

  it("keeps the same key across duplicate calls with equal ids", () => {
    const a = manyKey(PREFIX, "students", ["b", "a"]);
    const b = manyKey(PREFIX, "students", ["a", "b"]);

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
