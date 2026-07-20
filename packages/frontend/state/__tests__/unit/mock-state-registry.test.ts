/**
 * @file mock-state-registry.test.ts
 * @module @stackra/state/__tests__
 * @description Verifies the assertable testing mock.
 */

import { describe, it, expect } from "vitest";
import { Store } from "@tanstack/store";
import { createMockStateRegistry } from "@/testing";

describe("createMockStateRegistry", () => {
  const THEME = Symbol.for("THEME_STORE");

  it("registers stores and is assertable", () => {
    const registry = createMockStateRegistry();
    registry.registerStore("theme", THEME, new Store({ mode: "dark" }) as Store<unknown>);

    expect(registry.getNames()).toEqual(["theme"]);
    expect(registry.$.wasCalled("registerStore")).toBe(true);
  });
});
