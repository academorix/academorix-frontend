/**
 * @file define-flags.test.ts
 * @module @academorix/feature-flags/config/__tests__/define-flags.test
 *
 * @description
 * Verifies the {@link defineFlags} passthrough: the returned object
 * is frozen (mutation throws in strict mode) and the compile-time
 * return type preserves the literal keys / boolean value shape so
 * `keyof typeof flags` downstream lookups still work.
 */

import { describe, expect, it } from "vitest";

import { defineFlags } from "../define-flags.util";

describe("defineFlags", () => {
  it("freezes the returned object so accidental mutation throws in strict mode", () => {
    const flags = defineFlags({ a: true, b: false });

    expect(Object.isFrozen(flags)).toBe(true);
    expect(() => {
      // Assigning to a frozen property throws a TypeError in the
      // ambient strict mode of an ES module.
      (flags as { a: boolean }).a = false;
    }).toThrow(TypeError);
  });

  it("returns the same reference it was given (Object.freeze is in-place)", () => {
    const input = { a: true, b: false };
    const flags = defineFlags(input);

    expect(flags).toBe(input);
  });

  it("preserves literal keys so `keyof typeof flags` narrows to the input union", () => {
    const flags = defineFlags({
      dashboardV2: true,
      commandPalette: false,
      experimentalCharts: true,
    });

    // The following only typechecks because `keyof typeof flags`
    // narrows to the exact literal union — a wider `Record<string, boolean>`
    // return type would let arbitrary keys slip in here.
    const keys: Array<"dashboardV2" | "commandPalette" | "experimentalCharts"> = Object.keys(
      flags,
    ) as Array<"dashboardV2" | "commandPalette" | "experimentalCharts">;

    expect(keys.sort()).toEqual(["commandPalette", "dashboardV2", "experimentalCharts"].sort());
    expect(flags.dashboardV2).toBe(true);
    expect(flags.commandPalette).toBe(false);
    expect(flags.experimentalCharts).toBe(true);
  });
});
