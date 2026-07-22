// @vitest-environment jsdom
/**
 * @file use-scope.spec.tsx
 * @module @stackra/scope/__tests__/unit
 * @description Behavioural tests for {@link useScope} — verifies the
 *   `useSyncExternalStore` wiring against a stub `ScopeService`:
 *   snapshot reads, subscription, re-renders on state changes, action
 *   pass-through (`setScope`, `emulate`, `restore`), and cleanup on
 *   unmount.
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useScope } from "@/react/hooks/use-scope";
import { MockScopeService } from "@/testing/mock-scope-service";
import type { IScopeContext, IScopeNodeTreeNode } from "@/core/interfaces";

/** Hoisted service reference the mock factory closes over. */
const { serviceRef } = vi.hoisted(() => ({
  serviceRef: { current: null as MockScopeService | null },
}));

// Replace @stackra/container/react so useInject returns whatever the
// current test wired up in `serviceRef.current`. Same pattern as
// the actions package's hook tests.
vi.mock("@stackra/container/react", () => ({
  useInject: <T,>() => serviceRef.current as unknown as T,
}));

function ctx(nodeId: string, emulated = false): IScopeContext {
  return {
    ownerId: "org-1",
    nodeId,
    level: "venue",
    entityId: nodeId,
    path: [nodeId],
    ancestors: { venue: nodeId },
    emulated,
  };
}

function nodeTree(): IScopeNodeTreeNode[] {
  return [
    {
      id: "node-a",
      ownerId: "org-1",
      level: "venue",
      entityId: "venue-a",
      label: "Alpha",
      children: [],
    },
  ];
}

afterEach(() => {
  cleanup();
  serviceRef.current = null;
});

describe("useScope", () => {
  it("reads the initial snapshot", () => {
    serviceRef.current = new MockScopeService({
      scope: ctx("node-a"),
      tree: nodeTree(),
    });
    const { result } = renderHook(() => useScope());
    expect(result.current.scope?.nodeId).toBe("node-a");
    expect(result.current.tree).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEmulating).toBe(false);
  });

  it("re-renders when the service emits", async () => {
    const service = new MockScopeService({ scope: ctx("node-a") });
    serviceRef.current = service;
    const { result } = renderHook(() => useScope());
    expect(result.current.scope?.nodeId).toBe("node-a");

    act(() => {
      service.simulateScope(ctx("node-b"));
    });
    await waitFor(() => expect(result.current.scope?.nodeId).toBe("node-b"));
  });

  it("re-renders when the tree changes", async () => {
    const service = new MockScopeService({ tree: [] });
    serviceRef.current = service;
    const { result } = renderHook(() => useScope());
    expect(result.current.tree).toHaveLength(0);

    act(() => {
      service.simulateTree(nodeTree());
    });
    await waitFor(() => expect(result.current.tree).toHaveLength(1));
  });

  it("exposes setScope which routes to the service", async () => {
    const service = new MockScopeService({
      scope: ctx("node-a"),
      resolveScope: (id) => ctx(id),
    });
    serviceRef.current = service;
    const { result } = renderHook(() => useScope());

    await act(async () => {
      await result.current.setScope("node-b");
    });
    expect(result.current.scope?.nodeId).toBe("node-b");
    expect(result.current.isEmulating).toBe(false);
  });

  it("exposes emulate + restore round-trip", async () => {
    const service = new MockScopeService({
      scope: ctx("node-a"),
      resolveScope: (id) => ctx(id),
    });
    serviceRef.current = service;
    const { result } = renderHook(() => useScope());

    await act(async () => {
      await result.current.emulate("node-x");
    });
    expect(result.current.isEmulating).toBe(true);
    expect(result.current.scope?.nodeId).toBe("node-x");

    act(() => result.current.restore());
    expect(result.current.isEmulating).toBe(false);
    expect(result.current.scope?.nodeId).toBe("node-a");
  });

  it("unsubscribes on unmount", () => {
    const service = new MockScopeService({ scope: ctx("node-a") });
    serviceRef.current = service;
    const { unmount } = renderHook(() => useScope());
    const before = subscriberCount(service);
    unmount();
    const after = subscriberCount(service);
    expect(after).toBeLessThan(before);
  });

  it("returns a stable snapshot identity across renders when nothing changes", () => {
    // useSyncExternalStore requires referential stability from
    // getSnapshot; without it, React warns and can bail on updates.
    // Two consecutive `getSnapshot` reads on the service must return
    // the same object — this test locks that in through the mock.
    const service = new MockScopeService({ scope: ctx("node-a") });
    serviceRef.current = service;
    expect(service.getSnapshot()).toBe(service.getSnapshot());
  });
});

/** Peek at the service's private listener set via reflection. */
function subscriberCount(service: MockScopeService): number {
  return (service as unknown as { listeners: Set<unknown> }).listeners.size;
}
