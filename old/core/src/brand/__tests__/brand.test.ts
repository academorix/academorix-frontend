/**
 * @file brand.test.ts
 * @module @academorix/core/brand/__tests__/brand.test
 *
 * @description
 * Tests for the `Brand<T, Name>` + `Unbrand<T>` nominal-typing utilities.
 *
 * Brand types are entirely erased at runtime — there's no wrapping,
 * no property added, nothing to observe with a plain `expect(...)`.
 * The bulk of this suite is therefore compile-time — a mix of
 * `expectTypeOf` assertions (where they cooperate with intersection
 * brands) and the classic `Expect<Equal<A, B>>` type-equality trick
 * (which sidesteps `expect-type`'s branded-comparison strictness for
 * intersection-based nominal types).
 *
 * The runtime tests only verify that a plain string and its branded
 * cast remain strictly-equal — the whole point of the design.
 */

import { describe, expect, expectTypeOf, it } from "vitest";

import type { Brand, LocaleBrand, Unbrand } from "../";

/**
 * Classic tsd-style equality — TypeScript can't structurally compare
 * `Unbrand<Brand<T, N>>` to `T` inside `expect-type`'s
 * branded-equality helper, but the two-way conditional-function trick
 * works because it compares raw type identity.
 */
type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

type UserId = Brand<string, "UserId">;
type TenantId = Brand<string, "TenantId">;
type UserCount = Brand<number, "UserCount">;

describe("Brand<T, Name> — runtime behaviour", () => {
  it("adds no runtime overhead — the cast is invisible at runtime", () => {
    const raw = "u_abc123";
    const branded = raw as UserId;

    // Reference equality — the cast really is a no-op.
    expect(branded).toBe(raw);
  });

  it("branded values remain identical under strict equality", () => {
    const raw = "u_abc123";
    const branded = raw as UserId;

    expect(raw === branded).toBe(true);
  });

  it("branded values interoperate with plain-string APIs at runtime", () => {
    const branded = "hello" as UserId;

    // The underlying string methods still work.
    expect(branded.toUpperCase()).toBe("HELLO");
    expect(branded.length).toBe(5);
    expect(`${branded}-suffix`).toBe("hello-suffix");
  });

  it("branded numbers preserve arithmetic behaviour", () => {
    const count = 42 as UserCount;

    // At runtime a UserCount is just 42.
    expect(count + 1).toBe(43);
    expect(count * 2).toBe(84);
  });
});

describe("Brand<T, Name> — compile-time behaviour", () => {
  it("branded types are assignable to their base type", () => {
    // A UserId is structurally a string with a phantom prop — it IS
    // assignable to string.
    expectTypeOf<UserId>().toExtend<string>();
    expectTypeOf<UserCount>().toExtend<number>();
  });

  it("the base type is NOT assignable back to a Brand", () => {
    // A plain string cannot flow into a UserId without a cast — this
    // is the whole point of nominal typing.
    expectTypeOf<string>().not.toExtend<UserId>();
    expectTypeOf<number>().not.toExtend<UserCount>();
  });

  it("different brands with the same base are mutually incompatible", () => {
    // UserId and TenantId are both `string & { ... }` but with
    // different phantom tags — neither is assignable to the other.
    expectTypeOf<UserId>().not.toEqualTypeOf<TenantId>();
    expectTypeOf<TenantId>().not.toEqualTypeOf<UserId>();
    expectTypeOf<UserId>().not.toExtend<TenantId>();
    expectTypeOf<TenantId>().not.toExtend<UserId>();
  });

  it("Brand over a number base type is not assignable to a string base", () => {
    expectTypeOf<UserCount>().not.toExtend<string>();
    expectTypeOf<UserId>().not.toExtend<number>();
  });
});

describe("Unbrand<T>", () => {
  it("unwraps a string-based brand back to its base string type", () => {
    type Actual = Unbrand<UserId>;
    type _Check = Expect<Equal<Actual, string>>;

    // The assertion is compile-time (above). The runtime line below
    // simply keeps the check anchored to a test run — if the type
    // inference regresses, `_Check` fails to typecheck and the test
    // file won't compile.
    const _sentinel: _Check = true;

    expect(_sentinel).toBe(true);
  });

  it("unwraps a number-based brand back to its base number type", () => {
    type Actual = Unbrand<UserCount>;
    type _Check = Expect<Equal<Actual, number>>;

    const _sentinel: _Check = true;

    expect(_sentinel).toBe(true);
  });

  it("preserves the base branch of the conditional", () => {
    // Structurally, an unbrand of a branded string is a plain string.
    const raw = "u_1" as UserId;
    const unbranded = raw as Unbrand<UserId>;

    expect(unbranded).toBe("u_1");
    expect(typeof unbranded).toBe("string");
  });
});

describe("LocaleBrand", () => {
  it("is assignable to string at the type level", () => {
    expectTypeOf<LocaleBrand>().toExtend<string>();
  });

  it("unbrands back to string", () => {
    type Actual = Unbrand<LocaleBrand>;
    type _Check = Expect<Equal<Actual, string>>;

    const _sentinel: _Check = true;

    expect(_sentinel).toBe(true);
  });

  it("is not interchangeable with other string brands", () => {
    expectTypeOf<LocaleBrand>().not.toEqualTypeOf<UserId>();
    expectTypeOf<LocaleBrand>().not.toExtend<UserId>();
    expectTypeOf<UserId>().not.toExtend<LocaleBrand>();
  });
});
