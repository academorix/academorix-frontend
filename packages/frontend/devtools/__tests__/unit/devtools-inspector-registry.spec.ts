/**
 * @file devtools-inspector-registry.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Unit tests for `DevtoolsInspectorRegistry`.
 *
 *   The tests use `new DOMRect(...)` — the interface accepts a raw
 *   snapshot `DOMRect` or a lazy accessor, and the natural shape
 *   for a test fixture is the snapshot form. That requires jsdom,
 *   which is our vitest default so no environment pragma is needed.
 */

import { describe, expect, it, vi } from "vitest";

import { DevtoolsInspectorRegistry } from "@/core/registries/devtools-inspector.registry";
import type { IDevtoolsInspectorRegionSource } from "@stackra/contracts";

/** Build a minimal `IDevtoolsInspectorRegionSource`. */
function makeSource(id: string, regions: number[] = []): IDevtoolsInspectorRegionSource {
  return {
    id,
    label: `Source ${id}`,
    panelId: id,
    collect: () =>
      regions.map((n) => ({
        id: `${id}-${n}`,
        label: `${id}-${n}`,
        panelId: id,
        bounds: new DOMRect(n, n, 10, 10),
      })),
  };
}

describe("DevtoolsInspectorRegistry", () => {
  it("registers a source and surfaces it via sources()", () => {
    const registry = new DevtoolsInspectorRegistry();
    registry.register(makeSource("scope"));
    expect(registry.sources()).toHaveLength(1);
  });

  it("is last-wins per id", () => {
    const registry = new DevtoolsInspectorRegistry();
    registry.register(makeSource("scope", [1]));
    registry.register(makeSource("scope", [2, 3]));
    expect(registry.sources()).toHaveLength(1);
    expect(registry.collectAll()).toHaveLength(2);
  });

  it("collectAll flattens regions from every source", () => {
    const registry = new DevtoolsInspectorRegistry();
    registry.register(makeSource("a", [1, 2]));
    registry.register(makeSource("b", [3]));
    expect(registry.collectAll()).toHaveLength(3);
  });

  it("collectAll fails soft when a source throws", () => {
    const registry = new DevtoolsInspectorRegistry();
    registry.register({
      id: "ok",
      label: "ok",
      panelId: "ok",
      collect: () => [{ id: "r1", label: "r1", panelId: "ok", bounds: new DOMRect() }],
    });
    registry.register({
      id: "bad",
      label: "bad",
      panelId: "bad",
      collect: () => {
        throw new Error("boom");
      },
    });
    // The failing source is skipped; the good source still yields.
    expect(registry.collectAll()).toHaveLength(1);
  });

  it("subscribe fires on register + unregister", () => {
    const registry = new DevtoolsInspectorRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.register(makeSource("a"));
    registry.unregister("a");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("collectAll() returns a stable reference across successive reads", () => {
    // The cached snapshot is the property the shell's
    // `useSyncExternalStore` binding relies on to avoid tearing —
    // two reads with no intervening mutation must return === arrays.
    const registry = new DevtoolsInspectorRegistry();
    registry.register(makeSource("a", [1, 2]));
    const first = registry.collectAll();
    const second = registry.collectAll();
    expect(first).toBe(second);
  });

  it("collectAll() reference changes after register / unregister", () => {
    const registry = new DevtoolsInspectorRegistry();
    registry.register(makeSource("a", [1]));
    const before = registry.collectAll();
    registry.register(makeSource("b", [2]));
    expect(registry.collectAll()).not.toBe(before);
  });

  it("collectAll() reference is invalidated on unregister", () => {
    const registry = new DevtoolsInspectorRegistry();
    registry.register(makeSource("a", [1]));
    registry.register(makeSource("b", [2]));
    const before = registry.collectAll();
    registry.unregister("a");
    expect(registry.collectAll()).not.toBe(before);
    expect(registry.collectAll()).toHaveLength(1);
  });

  it("refresh() drops the cache, notifies subscribers, and returns fresh regions", () => {
    // Sources may return time-varying regions (a DOM measurement
    // that changes between reads). `refresh()` gives the toolbar a
    // way to force a re-scan even when the source list is unchanged.
    let n = 0;
    const source: IDevtoolsInspectorRegionSource = {
      id: "live",
      label: "live",
      panelId: "live",
      collect: () => [
        {
          id: `r-${n}`,
          label: `r-${n}`,
          panelId: "live",
          bounds: new DOMRect(n, n, 10, 10),
        },
      ],
    };
    const registry = new DevtoolsInspectorRegistry();
    registry.register(source);
    const listener = vi.fn();
    registry.subscribe(listener);
    const first = registry.collectAll();
    // Same underlying reads without a refresh return the same array
    // reference — the cache is doing its job.
    expect(registry.collectAll()).toBe(first);
    // Bump the source's state and refresh; the new snapshot must
    // differ from the cached one and every subscriber must fire.
    n = 1;
    const refreshed = registry.refresh();
    expect(refreshed).not.toBe(first);
    expect(refreshed[0]!.id).toBe("r-1");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
