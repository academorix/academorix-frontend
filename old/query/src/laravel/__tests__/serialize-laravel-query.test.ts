/**
 * @file serialize-laravel-query.test.ts
 * @module @academorix/query/laravel/__tests__/serialize-laravel-query.test
 *
 * @description
 * Unit tests for {@link serializeLaravelQuery} — the spatie/laravel-
 * query-builder v7 wire-format serialiser. Every semantic in the
 * contract table on the util is covered:
 *
 *  - Empty input → empty params.
 *  - Pagination on / off / server / client.
 *  - Sort single asc / desc / multiple mixed.
 *  - Every native operator → bare `filter[field]=value`.
 *  - Every custom operator → `filter[field][op]=value`.
 *  - Presence operators (`null` / `nnull`) → sentinel `1`.
 *  - Arrays → comma-joined.
 *  - Booleans → `1` / `0`.
 *  - Empty values dropped.
 *  - `include` array joined.
 *  - Conditional filter (`and` / `or`) flattens children.
 *  - Nested conditional recursion.
 */

import { describe, expect, it } from "vitest";

import { serializeLaravelQuery } from "../serialize-laravel-query.util";

import type {
  LaravelConditionalFilter,
  LaravelFilterOperator,
  LaravelLogicalFilter,
} from "../laravel-query.type";

describe("serializeLaravelQuery", () => {
  describe("empty input", () => {
    it("produces empty params for undefined input", () => {
      expect(serializeLaravelQuery().toString()).toBe("");
    });

    it("produces empty params for an empty object", () => {
      expect(serializeLaravelQuery({}).toString()).toBe("");
    });

    it("produces empty params when every field is empty", () => {
      expect(serializeLaravelQuery({ sorters: [], filters: [], include: [] }).toString()).toBe("");
    });
  });

  describe("pagination", () => {
    it("emits page + per_page when pagination is provided without mode", () => {
      const params = serializeLaravelQuery({
        pagination: { currentPage: 2, pageSize: 25 },
      });

      expect(params.get("page")).toBe("2");
      expect(params.get("per_page")).toBe("25");
    });

    it("emits page + per_page when mode is 'server'", () => {
      const params = serializeLaravelQuery({
        pagination: { mode: "server", currentPage: 3, pageSize: 50 },
      });

      expect(params.get("page")).toBe("3");
      expect(params.get("per_page")).toBe("50");
    });

    it("emits page + per_page when mode is 'client' (client-side pagination still asks the API for the collection)", () => {
      const params = serializeLaravelQuery({
        pagination: { mode: "client", currentPage: 1, pageSize: 100 },
      });

      expect(params.get("page")).toBe("1");
      expect(params.get("per_page")).toBe("100");
    });

    it("defaults currentPage=1, pageSize=10 when omitted", () => {
      const params = serializeLaravelQuery({ pagination: {} });

      expect(params.get("page")).toBe("1");
      expect(params.get("per_page")).toBe("10");
    });

    it("omits pagination entirely when mode is 'off'", () => {
      const params = serializeLaravelQuery({
        pagination: { mode: "off", currentPage: 2, pageSize: 25 },
      });

      expect(params.has("page")).toBe(false);
      expect(params.has("per_page")).toBe(false);
    });

    it("omits pagination when no pagination clause is provided", () => {
      const params = serializeLaravelQuery({});

      expect(params.has("page")).toBe(false);
      expect(params.has("per_page")).toBe(false);
    });
  });

  describe("sorters", () => {
    it("emits a single ascending sorter as a bare column name", () => {
      const params = serializeLaravelQuery({
        sorters: [{ field: "name", order: "asc" }],
      });

      expect(params.get("sort")).toBe("name");
    });

    it("emits a single descending sorter as a `-column` name", () => {
      const params = serializeLaravelQuery({
        sorters: [{ field: "created_at", order: "desc" }],
      });

      expect(params.get("sort")).toBe("-created_at");
    });

    it("emits multiple mixed sorters comma-joined in order", () => {
      const params = serializeLaravelQuery({
        sorters: [
          { field: "created_at", order: "desc" },
          { field: "name", order: "asc" },
          { field: "priority", order: "desc" },
        ],
      });

      expect(params.get("sort")).toBe("-created_at,name,-priority");
    });

    it("omits the sort param when sorters is empty", () => {
      const params = serializeLaravelQuery({ sorters: [] });

      expect(params.has("sort")).toBe(false);
    });
  });

  describe("native operators (bare filter[field]=value)", () => {
    /**
     * Each native operator maps to a stock `AllowedFilter` server-side —
     * the wire form is always `filter[field]=value`, no operator segment.
     */
    const NATIVE: LaravelFilterOperator[] = ["eq", "eqs", "contains", "containss", "in", "ina"];

    for (const operator of NATIVE) {
      it(`serialises \`${operator}\` as a bare filter[field]=value`, () => {
        const params = serializeLaravelQuery({
          filters: [{ field: "status", operator, value: "active" }],
        });

        expect(params.get("filter[status]")).toBe("active");
        expect(params.has(`filter[status][${operator}]`)).toBe(false);
      });
    }

    it("comma-joins array values for native operators (whereIn convention)", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "branch", operator: "in", value: ["a", "b", "c"] }],
      });

      expect(params.get("filter[branch]")).toBe("a,b,c");
    });
  });

  describe("custom operators (filter[field][op]=value)", () => {
    /**
     * Every non-native, non-presence operator emits an explicit
     * operator segment for a spatie custom filter to interpret.
     */
    const CUSTOM: LaravelFilterOperator[] = [
      "ne",
      "nes",
      "ncontains",
      "ncontainss",
      "nin",
      "nina",
      "lt",
      "lte",
      "gt",
      "gte",
      "between",
      "nbetween",
      "startswith",
      "startswiths",
      "endswith",
      "endswiths",
    ];

    for (const operator of CUSTOM) {
      it(`serialises \`${operator}\` as filter[field][${operator}]=value`, () => {
        const params = serializeLaravelQuery({
          filters: [{ field: "age", operator, value: 18 }],
        });

        expect(params.get(`filter[age][${operator}]`)).toBe("18");
        expect(params.has("filter[age]")).toBe(false);
      });
    }

    it("comma-joins array values for custom operators (between: [min, max])", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "age", operator: "between", value: [18, 65] }],
      });

      expect(params.get("filter[age][between]")).toBe("18,65");
    });
  });

  describe("presence operators (null / nnull)", () => {
    it("serialises `null` as filter[field][null]=1 (sentinel value)", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "deleted_at", operator: "null", value: undefined }],
      });

      expect(params.get("filter[deleted_at][null]")).toBe("1");
    });

    it("serialises `nnull` as filter[field][nnull]=1 (sentinel value)", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "verified_at", operator: "nnull", value: null }],
      });

      expect(params.get("filter[verified_at][nnull]")).toBe("1");
    });

    it("preserves the sentinel even when the caller supplies a value", () => {
      // Presence operators ignore the payload — they assert on absence, not
      // on a comparison value.
      const params = serializeLaravelQuery({
        filters: [{ field: "deleted_at", operator: "null", value: "ignored" }],
      });

      expect(params.get("filter[deleted_at][null]")).toBe("1");
    });
  });

  describe("value coercion", () => {
    it("coerces booleans to 1/0 for native operators", () => {
      const params = serializeLaravelQuery({
        filters: [
          { field: "active", operator: "eq", value: true },
          { field: "archived", operator: "eq", value: false },
        ],
      });

      expect(params.get("filter[active]")).toBe("1");
      expect(params.get("filter[archived]")).toBe("0");
    });

    it("coerces booleans to 1/0 for custom operators", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "verified", operator: "ne", value: false }],
      });

      expect(params.get("filter[verified][ne]")).toBe("0");
    });

    it("stringifies numbers", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "age", operator: "gte", value: 18 }],
      });

      expect(params.get("filter[age][gte]")).toBe("18");
    });
  });

  describe("empty value handling (non-presence operators)", () => {
    it("drops filter[field]=value when value is undefined", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "status", operator: "eq", value: undefined }],
      });

      expect(params.has("filter[status]")).toBe(false);
    });

    it("drops filter[field]=value when value is null", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "status", operator: "eq", value: null }],
      });

      expect(params.has("filter[status]")).toBe(false);
    });

    it("drops filter[field]=value when value is an empty string", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "search", operator: "contains", value: "" }],
      });

      expect(params.has("filter[search]")).toBe(false);
    });

    it("drops filter[field][op]=value when value is undefined (custom operator)", () => {
      const params = serializeLaravelQuery({
        filters: [{ field: "age", operator: "gte", value: undefined }],
      });

      expect(params.has("filter[age][gte]")).toBe(false);
    });
  });

  describe("include", () => {
    it("emits include as a comma-joined list", () => {
      const params = serializeLaravelQuery({ include: ["branch", "team", "coach"] });

      expect(params.get("include")).toBe("branch,team,coach");
    });

    it("omits the include param when the array is empty", () => {
      const params = serializeLaravelQuery({ include: [] });

      expect(params.has("include")).toBe(false);
    });

    it("omits the include param when not provided", () => {
      const params = serializeLaravelQuery({});

      expect(params.has("include")).toBe(false);
    });
  });

  describe("conditional filters (and / or)", () => {
    it("flattens the children of an `and` group", () => {
      const filters: LaravelConditionalFilter[] = [
        {
          operator: "and",
          value: [
            { field: "status", operator: "eq", value: "active" },
            { field: "age", operator: "gte", value: 18 },
          ],
        },
      ];

      const params = serializeLaravelQuery({ filters });

      expect(params.get("filter[status]")).toBe("active");
      expect(params.get("filter[age][gte]")).toBe("18");
    });

    it("flattens the children of an `or` group", () => {
      const filters: LaravelConditionalFilter[] = [
        {
          operator: "or",
          value: [
            { field: "email", operator: "eq", value: "a@x.com" },
            { field: "email", operator: "eq", value: "b@x.com" },
          ],
        },
      ];

      const params = serializeLaravelQuery({ filters });

      // `URLSearchParams.getAll` preserves append order — both emails
      // land under the same param key.
      expect(params.getAll("filter[email]")).toEqual(["a@x.com", "b@x.com"]);
    });

    it("recurses through nested conditional groups", () => {
      const filters: LaravelConditionalFilter[] = [
        {
          operator: "and",
          value: [
            { field: "status", operator: "eq", value: "active" },
            {
              operator: "or",
              value: [
                { field: "age", operator: "gte", value: 18 },
                { field: "guardian_id", operator: "nnull", value: null },
              ],
            },
          ],
        },
      ];

      const params = serializeLaravelQuery({ filters });

      expect(params.get("filter[status]")).toBe("active");
      expect(params.get("filter[age][gte]")).toBe("18");
      expect(params.get("filter[guardian_id][nnull]")).toBe("1");
    });
  });

  describe("integration", () => {
    it("combines pagination + sort + include + filters in one params instance", () => {
      const params = serializeLaravelQuery({
        pagination: { currentPage: 2, pageSize: 25 },
        sorters: [{ field: "created_at", order: "desc" }],
        include: ["branch"],
        filters: [
          { field: "status", operator: "eq", value: "active" },
          { field: "age", operator: "gte", value: 18 },
        ],
      });

      expect(params.get("page")).toBe("2");
      expect(params.get("per_page")).toBe("25");
      expect(params.get("sort")).toBe("-created_at");
      expect(params.get("include")).toBe("branch");
      expect(params.get("filter[status]")).toBe("active");
      expect(params.get("filter[age][gte]")).toBe("18");
    });

    it("appends multiple logical filters on the same field without collapsing them", () => {
      // `URLSearchParams.append` (which the util uses) preserves both
      // entries — the resulting params carry two separate `filter[age]`
      // values, matching how a `between` filter is typically emitted as
      // two independent bounds by some upstream UI components.
      const filters: LaravelLogicalFilter[] = [
        { field: "age", operator: "gte", value: 18 },
        { field: "age", operator: "lte", value: 65 },
      ];

      const params = serializeLaravelQuery({ filters });

      expect(params.get("filter[age][gte]")).toBe("18");
      expect(params.get("filter[age][lte]")).toBe("65");
    });
  });
});
