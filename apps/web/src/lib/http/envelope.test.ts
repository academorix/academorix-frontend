/**
 * @file envelope.test.ts
 * @module lib/http/envelope.test
 *
 * @description
 * Unit tests for the response-envelope helpers that sit between the raw
 * `fetch` body and the callers that want to lift `data`/`meta` out. Covers the
 * two shapes the backend emits (see PLAN.md §1.4): the Foundation envelope
 * (`{message, status, data, meta?}`) and the bare auth DTO
 * (`AuthTokenData`-like objects returned at the response root).
 */

import { describe, expect, it } from "vitest";

import type { FoundationEnvelope } from "@/lib/http/envelope";

import { extractPaginationMeta, isFoundationEnvelope, unwrapEnvelope } from "@/lib/http/envelope";

describe("isFoundationEnvelope", () => {
  it("recognises a full envelope with data and meta", () => {
    const body: FoundationEnvelope<{ id: string }[]> = {
      message: "ok",
      status: 200,
      data: [{ id: "a" }],
      meta: { total: 1, current_page: 1, per_page: 25 },
    };

    expect(isFoundationEnvelope(body)).toBe(true);
  });

  it("recognises an envelope whose data is explicitly null (204 shape)", () => {
    expect(isFoundationEnvelope({ data: null, message: "" })).toBe(true);
  });

  it("recognises an envelope with only the required data key", () => {
    expect(isFoundationEnvelope({ data: { id: 1 } })).toBe(true);
  });

  it("rejects arrays", () => {
    expect(isFoundationEnvelope([{ id: 1 }])).toBe(false);
    expect(isFoundationEnvelope([])).toBe(false);
  });

  it("rejects null and primitive values", () => {
    expect(isFoundationEnvelope(null)).toBe(false);
    expect(isFoundationEnvelope(undefined)).toBe(false);
    expect(isFoundationEnvelope("data")).toBe(false);
    expect(isFoundationEnvelope(42)).toBe(false);
    expect(isFoundationEnvelope(true)).toBe(false);
  });

  it("rejects plain objects without a data key", () => {
    // A bare auth DTO — has `access_token` etc., no `data` field.
    expect(isFoundationEnvelope({ access_token: "abc", token_type: "Bearer", abilities: [] })).toBe(
      false,
    );
    expect(isFoundationEnvelope({})).toBe(false);
    expect(isFoundationEnvelope({ meta: { total: 5 } })).toBe(false);
  });
});

describe("unwrapEnvelope", () => {
  it("lifts the data field out of a Foundation envelope", () => {
    const body: FoundationEnvelope<{ id: string; name: string }> = {
      status: 200,
      data: { id: "u-1", name: "Jane" },
    };

    expect(unwrapEnvelope<{ id: string; name: string }>(body)).toEqual({
      id: "u-1",
      name: "Jane",
    });
  });

  it("returns a bare DTO unchanged (bare auth token response)", () => {
    const dto = {
      access_token: "abc.def",
      token_type: "Bearer",
      abilities: ["*"],
      expires_at: null,
    };

    expect(unwrapEnvelope(dto)).toBe(dto);
  });

  it("returns arrays unchanged (bare-array endpoints)", () => {
    const list = [{ id: 1 }, { id: 2 }];

    expect(unwrapEnvelope(list)).toBe(list);
  });

  it("returns null unchanged when the body itself is null", () => {
    expect(unwrapEnvelope(null)).toBeNull();
  });

  it("preserves data even when it is explicitly null", () => {
    expect(unwrapEnvelope<null>({ data: null })).toBeNull();
  });
});

describe("extractPaginationMeta", () => {
  it("returns total + meta for a paginated envelope", () => {
    const body: FoundationEnvelope<{ id: string }[]> = {
      data: [{ id: "a" }, { id: "b" }],
      meta: {
        total: 42,
        current_page: 2,
        per_page: 25,
        from: 26,
        to: 42,
      },
    };

    expect(extractPaginationMeta(body)).toEqual({
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

  it("returns undefined total + empty meta when the envelope carries no meta", () => {
    expect(extractPaginationMeta({ data: { id: "u-1" } })).toEqual({
      total: undefined,
      meta: {},
    });
  });

  it("returns undefined total + empty meta for a bare DTO", () => {
    // Bare auth DTO — no `data` key, so treated as non-Foundation.
    expect(extractPaginationMeta({ access_token: "abc", token_type: "Bearer" })).toEqual({
      total: undefined,
      meta: {},
    });
  });

  it("returns undefined total + empty meta for null", () => {
    expect(extractPaginationMeta(null)).toEqual({ total: undefined, meta: {} });
  });

  it("returns undefined total when meta is present but total is absent", () => {
    const body: FoundationEnvelope<{ id: string }[]> = {
      data: [{ id: "a" }],
      meta: { current_page: 1, per_page: 25 },
    };

    expect(extractPaginationMeta(body)).toEqual({
      total: undefined,
      meta: { current_page: 1, per_page: 25 },
    });
  });
});
