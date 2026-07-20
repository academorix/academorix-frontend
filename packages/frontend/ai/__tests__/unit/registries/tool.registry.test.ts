/**
 * @file tool.registry.test.ts
 * @description Unit tests for {@link ToolRegistry} — ref-counting (Req 6.10),
 *   last-registered-wins with collision warning (Req 6.9), scope keying
 *   (Req 6.11), lookup by name, and change notification (event bus + local
 *   listeners).
 */

import { describe, expect, it, vi } from "vitest";
import { AI_EVENTS, type IEventEmitter } from "@stackra/contracts";

import { ToolRegistry, type IToolEntry } from "@/core/registries/tool.registry";

const noop = async (): Promise<void> => undefined;
const entry = (
  name: string,
  opts: { scope?: string; handler?: () => Promise<unknown> } = {},
): {
  definition: { name: string; description: string; parameters: unknown; scope?: string };
  handler: () => Promise<unknown>;
} => ({
  definition: {
    name,
    description: "",
    parameters: {},
    ...(opts.scope !== undefined ? { scope: opts.scope } : {}),
  },
  handler: opts.handler ?? noop,
});

describe("ToolRegistry", () => {
  it("registers a tool with refCount 1 (Req 6.4/6.10)", () => {
    const registry = new ToolRegistry();
    registry.register(entry("nav"));
    expect(registry.count()).toBe(1);
    expect(registry.findByName("nav")?.refCount).toBe(1);
  });

  it("unregister removes the tool when refCount reaches zero", () => {
    const registry = new ToolRegistry();
    registry.register(entry("nav"));
    registry.unregister("nav");
    expect(registry.hasName("nav")).toBe(false);
    expect(registry.count()).toBe(0);
  });

  it("ref-counts duplicate registrations under the same name (Req 6.10)", () => {
    const registry = new ToolRegistry();
    registry.register(entry("nav"));
    registry.register(entry("nav"));
    expect(registry.findByName("nav")?.refCount).toBe(2);
    registry.unregister("nav");
    expect(registry.findByName("nav")?.refCount).toBe(1);
    registry.unregister("nav");
    expect(registry.hasName("nav")).toBe(false);
  });

  it("last-registered-wins for handler and definition (Req 6.9)", async () => {
    const registry = new ToolRegistry();
    const first = vi.fn().mockResolvedValue("A");
    const second = vi.fn().mockResolvedValue("B");
    registry.register(entry("nav", { handler: first }));
    registry.register(entry("nav", { handler: second }));
    const winner = registry.findByName("nav");
    expect(winner?.handler).toBe(second);
  });

  it("unregister on an unknown name is a no-op (does not throw)", () => {
    const registry = new ToolRegistry();
    expect(() => registry.unregister("missing")).not.toThrow();
    expect(registry.count()).toBe(0);
  });

  it("supports scope-distinct registrations (Req 6.11)", () => {
    const registry = new ToolRegistry();
    registry.register(entry("nav", { scope: "drawer" }));
    registry.register(entry("nav", { scope: "popup" }));
    expect(registry.count()).toBe(2);
    expect(registry.get("nav", "drawer")).toBeDefined();
    expect(registry.get("nav", "popup")).toBeDefined();
    expect(registry.hasName("nav")).toBe(true);
  });

  it("findByName returns the last-inserted entry when multiple scopes share a name", () => {
    const registry = new ToolRegistry();
    registry.register(entry("nav", { scope: "drawer" }));
    registry.register(entry("nav", { scope: "popup" }));
    const found = registry.findByName("nav");
    expect(found?.definition.scope).toBe("popup");
  });

  it("unregistering a scoped tool leaves the other scoped registrations intact", () => {
    const registry = new ToolRegistry();
    registry.register(entry("nav", { scope: "drawer" }));
    registry.register(entry("nav", { scope: "popup" }));
    registry.unregister("nav", "popup");
    expect(registry.hasName("nav")).toBe(true);
    expect(registry.get("nav", "drawer")).toBeDefined();
    expect(registry.get("nav", "popup")).toBeUndefined();
  });

  it("notifies listeners on register and unregister", () => {
    const registry = new ToolRegistry();
    const listener = vi.fn();
    registry.onChange(listener);
    registry.register(entry("a"));
    registry.register(entry("b"));
    registry.unregister("a");
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("emits AI_EVENTS.TOOLSET_CHANGED on the shared event bus when available", () => {
    const emit = vi.fn(() => Promise.resolve());
    const events: IEventEmitter = {
      emit,
      on: () => () => undefined,
      eventNames: () => [],
      listenerCount: () => 0,
      removeAllListeners: () => undefined,
    };
    const registry = new ToolRegistry(events);
    registry.register(entry("a"));
    expect(emit).toHaveBeenCalledWith(
      AI_EVENTS.TOOLSET_CHANGED,
      expect.objectContaining({ count: 1 }),
    );
  });

  it("all() returns a snapshot in insertion order", () => {
    const registry = new ToolRegistry();
    registry.register(entry("a"));
    registry.register(entry("b"));
    registry.register(entry("c"));
    expect(registry.all().map((e: IToolEntry) => e.name)).toEqual(["a", "b", "c"]);
  });

  it("onChange returns an unsubscribe function", () => {
    const registry = new ToolRegistry();
    const listener = vi.fn();
    const off = registry.onChange(listener);
    off();
    registry.register(entry("a"));
    expect(listener).not.toHaveBeenCalled();
  });
});
