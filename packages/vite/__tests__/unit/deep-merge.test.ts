/**
 * @file deep-merge.test.ts
 * @module @stackra/vite/test/unit
 * @description Unit tests for the `deepMerge(...)` utility — plain
 *   object recursion, array concatenation, primitive overwrite,
 *   `undefined` skip, and class-instance overwrite.
 */

import { describe, expect, it } from "vitest";
import { deepMerge } from "@/core/utils/deep-merge.util";

describe("deepMerge", () => {
  it("merges plain objects recursively — both sides survive, override wins on conflict", () => {
    const base = { a: 1, nested: { x: 1, y: 2 } };
    const overrides = { b: 2, nested: { y: 20, z: 3 } };

    const result = deepMerge(base, overrides as Partial<typeof base & { b: number }>);

    expect(result).toEqual({ a: 1, b: 2, nested: { x: 1, y: 20, z: 3 } });
  });

  it("concatenates arrays instead of overwriting them", () => {
    const base = { plugins: ["a", "b"] };
    const overrides = { plugins: ["c"] };

    const result = deepMerge(base, overrides);

    expect(result.plugins).toEqual(["a", "b", "c"]);
  });

  it("overwrites primitive values with the override", () => {
    const base = { port: 3000, host: "localhost" };
    const overrides = { port: 8080 };

    const result = deepMerge(base, overrides);

    expect(result).toEqual({ port: 8080, host: "localhost" });
  });

  it("skips `undefined` values in the override (base value survives)", () => {
    const base = { port: 3000, host: "localhost" };
    const overrides = { port: undefined };

    const result = deepMerge(base, overrides as Partial<typeof base>);

    expect(result.port).toBe(3000);
    expect(result.host).toBe("localhost");
  });

  it("allows `null` in the override to clear a field (falls through to primitive branch)", () => {
    const base = { host: "localhost" };
    const overrides = { host: null };

    const result = deepMerge(base, overrides as unknown as Partial<typeof base>);

    expect(result.host).toBeNull();
  });

  it("overwrites a base plain object with a class instance (isPlainObject returns false)", () => {
    class MyThing {
      public constructor(public readonly name: string) {}
    }

    const base = { thing: { name: "plain" } };
    const overrides = { thing: new MyThing("instance") };

    const result = deepMerge(base, overrides as unknown as Partial<typeof base>);

    expect(result.thing).toBeInstanceOf(MyThing);
    expect((result.thing as MyThing).name).toBe("instance");
  });

  it("does not mutate the base input", () => {
    const base = { a: 1, nested: { x: 1 } };
    const overrides = { nested: { x: 99 } };

    const originalBase = JSON.parse(JSON.stringify(base));
    deepMerge(base, overrides);

    expect(base).toEqual(originalBase);
  });

  it("merges deeply nested objects across multiple levels", () => {
    const base = { level1: { level2: { level3: { a: 1, b: 2 } } } };
    const overrides = { level1: { level2: { level3: { b: 20, c: 3 } } } };

    const result = deepMerge(base, overrides);

    expect(result.level1.level2.level3).toEqual({ a: 1, b: 20, c: 3 });
  });

  it("handles mismatched types by overwriting (base object, override array)", () => {
    const base = { field: { a: 1 } };
    const overrides = { field: [1, 2, 3] };

    const result = deepMerge(base, overrides as unknown as Partial<typeof base>);

    expect(result.field).toEqual([1, 2, 3]);
  });

  it("handles mismatched types by overwriting (base array, override object)", () => {
    const base = { field: [1, 2] };
    const overrides = { field: { a: 1 } };

    const result = deepMerge(base, overrides as unknown as Partial<typeof base>);

    expect(result.field).toEqual({ a: 1 });
  });
});
