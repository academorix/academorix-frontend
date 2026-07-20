/**
 * @file nested-value.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for the hand-rolled dotted-path helpers
 *   (`getNestedValue`, `setNestedValue`, `hasNestedValue`) that
 *   replace `es-toolkit/compat/{get,set,has}`.
 */

import { describe, expect, it } from "vitest";

// Import from the util files directly — these are package-internal
// helpers not on the public root barrel.
import { getNestedValue } from "@/core/utils/get-nested-value.util";
import { hasNestedValue } from "@/core/utils/has-nested-value.util";
import { setNestedValue } from "@/core/utils/set-nested-value.util";

describe("getNestedValue", () => {
  it("resolves a shallow dotted path", () => {
    expect(getNestedValue({ a: { b: { c: 42 } } }, "a.b.c")).toBe(42);
  });

  it("resolves a top-level key", () => {
    expect(getNestedValue({ port: 3000 }, "port")).toBe(3000);
  });

  it("returns undefined for a missing intermediate segment", () => {
    expect(getNestedValue({}, "a.b.c")).toBeUndefined();
  });

  it("returns undefined when the object is null or undefined", () => {
    expect(getNestedValue(null, "a.b")).toBeUndefined();
    expect(getNestedValue(undefined, "a.b")).toBeUndefined();
  });

  it("handles bracketed array indices", () => {
    expect(getNestedValue({ items: [{ id: 1 }, { id: 2 }] }, "items[0].id")).toBe(1);
    expect(getNestedValue({ items: [{ id: 1 }, { id: 2 }] }, "items[1].id")).toBe(2);
  });

  it("handles a symbol top-level key", () => {
    const sym = Symbol("secret");
    expect(getNestedValue({ [sym]: "value" }, sym)).toBe("value");
  });
});

describe("setNestedValue", () => {
  it("writes onto a shallow path, creating intermediates", () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, "a.b.c", 42);
    expect(obj).toEqual({ a: { b: { c: 42 } } });
  });

  it("creates arrays for numeric-string next segments", () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, "items[0].name", "first");
    expect(Array.isArray((obj as { items: unknown[] }).items)).toBe(true);
    expect(obj).toEqual({ items: [{ name: "first" }] });
  });

  it("writes a symbol top-level key directly", () => {
    const sym = Symbol("key");
    const obj: Record<string | symbol, unknown> = {};
    setNestedValue(obj, sym, "value");
    expect(obj[sym]).toBe("value");
  });

  it("does not clobber unrelated siblings on the path", () => {
    const obj: Record<string, unknown> = { a: { existing: true } };
    setNestedValue(obj, "a.new", 42);
    expect(obj).toEqual({ a: { existing: true, new: 42 } });
  });
});

describe("hasNestedValue", () => {
  it("returns true for a resolved path", () => {
    expect(hasNestedValue({ a: { b: 1 } }, "a.b")).toBe(true);
  });

  it("returns true for a key explicitly set to undefined", () => {
    expect(hasNestedValue({ a: { b: undefined } }, "a.b")).toBe(true);
  });

  it("returns false for a missing segment", () => {
    expect(hasNestedValue({ a: {} }, "a.b")).toBe(false);
  });

  it("returns false when the object is null or undefined", () => {
    expect(hasNestedValue(null, "a.b")).toBe(false);
    expect(hasNestedValue(undefined, "a.b")).toBe(false);
  });
});
