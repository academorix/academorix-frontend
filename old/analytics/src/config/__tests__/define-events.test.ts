/**
 * @file define-events.test.ts
 * @module @academorix/analytics/config/__tests__/define-events.test
 *
 * @description
 * Verifies the {@link defineEvents} passthrough: freezes the result
 * and preserves the literal string keys / string values so
 * `keyof typeof EVENTS` narrows to the exact registry.
 */

import { describe, expect, it } from "vitest";

import { defineEvents } from "../define-events.util";

describe("defineEvents", () => {
  it("freezes the returned object so mutation throws in strict mode", () => {
    const events = defineEvents({ a: "wire_a", b: "wire_b" });

    expect(Object.isFrozen(events)).toBe(true);
    expect(() => {
      (events as { a: string }).a = "mutated";
    }).toThrow(TypeError);
  });

  it("returns the same reference it was given", () => {
    const input = { a: "wire_a", b: "wire_b" };
    const events = defineEvents(input);

    expect(events).toBe(input);
  });

  it("preserves literal keys so `keyof typeof EVENTS` narrows to the union", () => {
    const EVENTS = defineEvents({
      userLoggedIn: "user_logged_in",
      athleteCreated: "athlete_created",
    });

    // Only compiles because the return type still carries the literal
    // key set. A widened `Record<string, string>` return would allow
    // any key here at compile time.
    const key: keyof typeof EVENTS = "userLoggedIn";
    const wire: (typeof EVENTS)[keyof typeof EVENTS] = "user_logged_in";

    expect(EVENTS[key]).toBe("user_logged_in");
    expect(wire).toBe("user_logged_in");
  });
});
