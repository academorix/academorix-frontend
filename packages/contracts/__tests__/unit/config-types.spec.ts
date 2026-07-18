/**
 * @file config-types.spec.ts
 * @module @stackra/contracts/__tests__/unit
 * @description Compile-time (type-level) spec for the config namespace's
 *   fork-derived path types (`Path<T>` + `PathValue<T, P>`) and the
 *   `NoInferType<T>` helper. Runs via vitest's `expectTypeOf` so the
 *   normal `vitest run` picks it up alongside runtime specs.
 */

import { describe, expectTypeOf, it } from "vitest";

import type { NoInferType, Path, PathValue } from "@stackra/contracts";

describe("Path<T>", () => {
  it("narrows a flat shape to its top-level keys", () => {
    type Flat = { host: string; port: number };
    expectTypeOf<Path<Flat>>().toEqualTypeOf<"host" | "port">();
  });

  it("produces every legal dotted path from a nested shape", () => {
    type Nested = { database: { host: string; port: number } };
    // `Path<T>` includes the parent key AND every child descent.
    expectTypeOf<Path<Nested>>().toEqualTypeOf<"database" | "database.host" | "database.port">();
  });

  it("descends through multiple levels of nesting", () => {
    type Deep = { a: { b: { c: number } } };
    expectTypeOf<Path<Deep>>().toEqualTypeOf<"a" | "a.b" | "a.b.c">();
  });
});

describe("PathValue<T, P>", () => {
  it("resolves a top-level key to its own type", () => {
    type Flat = { host: string; port: number };
    expectTypeOf<PathValue<Flat, "host">>().toEqualTypeOf<string>();
    expectTypeOf<PathValue<Flat, "port">>().toEqualTypeOf<number>();
  });

  it("resolves a nested dotted path to the value type at that path", () => {
    type Nested = { database: { host: string; port: number } };
    expectTypeOf<PathValue<Nested, "database.host">>().toEqualTypeOf<string>();
    expectTypeOf<PathValue<Nested, "database.port">>().toEqualTypeOf<number>();
  });

  it("resolves an intermediate path to the sub-object type", () => {
    type Nested = { database: { host: string; port: number } };
    expectTypeOf<PathValue<Nested, "database">>().toEqualTypeOf<{
      host: string;
      port: number;
    }>();
  });
});

describe("NoInferType<T>", () => {
  it("is the identity type for a concrete generic", () => {
    // `NoInferType<T>` should behave as an identity — its runtime
    // purpose (suppressing inference from a default-value slot) is a
    // compile-only trick; the resolved type is still `T`.
    expectTypeOf<NoInferType<string>>().toEqualTypeOf<string>();
    expectTypeOf<NoInferType<number>>().toEqualTypeOf<number>();
    expectTypeOf<NoInferType<{ a: 1 }>>().toEqualTypeOf<{ a: 1 }>();
  });
});
