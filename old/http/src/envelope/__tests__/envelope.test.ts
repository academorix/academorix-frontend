/**
 * @file envelope.test.ts
 * @module @academorix/http/envelope/envelope.test
 *
 * @description
 * Unit tests for the Foundation-envelope helpers. The backend emits
 * either a Foundation envelope (`{message, status, data, meta?}`) or
 * a bare DTO (auth token payloads). {@link isFoundationEnvelope}
 * discriminates the two, {@link unwrapEnvelope} lifts `data` out, and
 * {@link extractPaginationMeta} normalises the pagination surface for
 * Refine's `getList`.
 */

import { describe, expect, it } from "vitest";

import { extractPaginationMeta, isFoundationEnvelope, unwrapEnvelope } from "../envelope.util";

import type { FoundationEnvelope } from "../envelope.util";

describe("isFoundationEnvelope", () => {
  it("returns true for { data: [] }", () => {
    expect(isFoundationEnvelope({ data: [] })).toBe(true);
  });

  it("returns true for { data: null } — null is a valid data payload", () => {
    expect(isFoundationEnvelope({ data: null })).toBe(true);
  });

  it("returns false for a bare DTO with unrelated keys", () => {
    expect(isFoundationEnvelope({ id: 1, name: "x" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isFoundationEnvelope(null)).toBe(false);
  });
});

describe("unwrapEnvelope", () => {
  it("returns the array payload from a Foundation envelope with a data list", () => {
    const list = [{ id: 1 }, { id: 2 }];
    const envelope: FoundationEnvelope<{ id: number }[]> = { data: list };

    expect(unwrapEnvelope<{ id: number }[]>(envelope)).toBe(list);
  });

  it("returns a bare DTO unchanged", () => {
    const dto = { id: 1, name: "x" };

    expect(unwrapEnvelope(dto)).toBe(dto);
  });
});

describe("extractPaginationMeta", () => {
  it("returns { total, meta } when the envelope carries pagination meta", () => {
    const envelope: FoundationEnvelope<{ id: string }[]> = {
      data: [{ id: "a" }],
      meta: {
        total: 42,
        current_page: 2,
        per_page: 25,
        from: 26,
        to: 42,
      },
    };

    expect(extractPaginationMeta(envelope)).toEqual({
      total: 42,
      meta: {
        total: 42,
        current_page: 2,
        per_page: 25,
        from: 26,
        to: 42,
      },
    });
  });

  it("returns { total: undefined, meta: {} } when the envelope has no meta", () => {
    expect(extractPaginationMeta({ data: { id: 1 } })).toEqual({
      total: undefined,
      meta: {},
    });
  });

  it("returns { total: undefined, meta: {} } for a bare DTO with no data key", () => {
    expect(extractPaginationMeta({ access_token: "abc", token_type: "Bearer" })).toEqual({
      total: undefined,
      meta: {},
    });
  });
});
