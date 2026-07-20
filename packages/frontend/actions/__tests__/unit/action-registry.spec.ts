/**
 * @file action-registry.spec.ts
 * @description Unit tests for {@link ActionRegistry}.
 */

import { describe, expect, it } from "vitest";
import type { IActionHandler } from "@stackra/contracts";
import { ActionRegistry } from "@/core/registries/action.registry";

const makeHandler = (kind: string): IActionHandler => ({
  kind,
  execute: () => ({ success: true }),
});

describe("ActionRegistry", () => {
  it("registers and resolves a handler", () => {
    const registry = new ActionRegistry();
    const handler = makeHandler("toast");
    registry.register("toast", handler);
    expect(registry.resolve("toast")).toBe(handler);
    expect(registry.has("toast")).toBe(true);
  });

  it("last-wins on collision", () => {
    const registry = new ActionRegistry();
    const first = makeHandler("toast");
    const second = makeHandler("toast");
    registry.register("toast", first);
    registry.register("toast", second);
    expect(registry.resolve("toast")).toBe(second);
  });

  it("unregisters a handler", () => {
    const registry = new ActionRegistry();
    registry.register("toast", makeHandler("toast"));
    expect(registry.unregister("toast")).toBe(true);
    expect(registry.resolve("toast")).toBeUndefined();
    expect(registry.unregister("toast")).toBe(false);
  });

  it("returns undefined for unknown kinds", () => {
    const registry = new ActionRegistry();
    expect(registry.resolve("nonexistent")).toBeUndefined();
  });
});
