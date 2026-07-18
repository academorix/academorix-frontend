/**
 * @file assert.test.ts
 * @module @academorix/core/utils/__tests__/assert.test
 *
 * @description
 * Tests for {@link assertNever} + {@link assertDefined}. Covers the
 * runtime contract; the type-level exhaustiveness check for
 * `assertNever` is implicit — if `never` weren't enforced the source
 * wouldn't compile.
 */

import { describe, expect, it } from "vitest";

import { assertDefined, assertNever } from "../assert.util";

describe("assertNever()", () => {
  it("throws an Error with the JSON-stringified value", () => {
    // Cast to `never` to satisfy the compile-time constraint — the
    // whole point of the helper is to guard "impossible" runtime paths.
    expect(() => assertNever("unexpected" as never)).toThrowError(
      'Unhandled variant: "unexpected"',
    );
  });

  it("stringifies objects into the message", () => {
    expect(() => assertNever({ tag: "unknown" } as never)).toThrowError(
      /Unhandled variant: \{"tag":"unknown"\}/,
    );
  });

  it("stringifies numeric variants", () => {
    expect(() => assertNever(42 as never)).toThrowError("Unhandled variant: 42");
  });

  it("throws an actual Error instance", () => {
    try {
      assertNever("x" as never);
    } catch (caught) {
      expect(caught).toBeInstanceOf(Error);

      return;
    }
    throw new Error("assertNever did not throw");
  });
});

describe("assertDefined()", () => {
  it("throws the supplied message when the value is null", () => {
    expect(() => assertDefined(null, "missing element")).toThrowError("missing element");
  });

  it("throws the supplied message when the value is undefined", () => {
    expect(() => assertDefined(undefined, "missing element")).toThrowError("missing element");
  });

  it("returns 0 unchanged (zero is defined)", () => {
    expect(assertDefined(0, "should not throw")).toBe(0);
  });

  it("returns an empty string unchanged (empty string is defined)", () => {
    expect(assertDefined("", "should not throw")).toBe("");
  });

  it("returns false unchanged (false is defined)", () => {
    expect(assertDefined(false, "should not throw")).toBe(false);
  });

  it("returns objects by reference", () => {
    const source = { foo: 1 };

    expect(assertDefined(source, "should not throw")).toBe(source);
  });

  it("narrows the value type from T | null | undefined to T", () => {
    const maybe: string | undefined = "hello";

    const defined = assertDefined(maybe, "should not throw");

    // If narrowing works, this line typechecks — .toUpperCase() only
    // exists on `string`, not on `string | undefined`.
    expect(defined.toUpperCase()).toBe("HELLO");
  });

  it("throws an actual Error instance", () => {
    try {
      assertDefined(null, "boom");
    } catch (caught) {
      expect(caught).toBeInstanceOf(Error);

      return;
    }
    throw new Error("assertDefined did not throw");
  });
});
