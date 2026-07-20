/**
 * @file mock-navigate.util.spec.ts
 * @module @stackra/routing/__tests__/testing
 * @description Unit tests for the mock navigate helper.
 */

import { describe, expect, it } from "vitest";

import { mockNavigate } from "@/testing/mock-navigate.util";

describe("mockNavigate", () => {
  it("records every dispatched call", async () => {
    const nav = mockNavigate();
    await nav.fn("/dashboard");
    await nav.fn("/users/42", { replace: true });
    expect(nav.calls).toEqual([{ to: "/dashboard" }, { to: "/users/42", opts: { replace: true } }]);
  });

  it("reset() clears the recorded list", async () => {
    const nav = mockNavigate();
    await nav.fn("/a");
    expect(nav.calls).toHaveLength(1);
    nav.reset();
    expect(nav.calls).toHaveLength(0);
  });
});
