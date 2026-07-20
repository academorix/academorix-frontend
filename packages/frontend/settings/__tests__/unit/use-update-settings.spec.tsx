// @vitest-environment jsdom
/**
 * @file use-update-settings.spec.tsx
 * @module @stackra/settings/__tests__/unit
 * @description React hook tests for `useUpdateSettings` — verify
 *   the three mutation modes route into the settings service
 *   correctly and expose the `useMutation`-style state machine.
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateSettings } from "@/react/hooks/use-update-settings";
import { MockSettingsRegistry, MockSettingsService } from "@/testing";

// ══════════════════════════════════════════════════════════════════
// Injector shims — hoist refs so the mocked useInject/useOptional
// can pick them up per test.
// ══════════════════════════════════════════════════════════════════

const { registryRef, serviceRef, undoableQueueRef, eventsRef } = vi.hoisted(() => ({
  registryRef: { current: null as MockSettingsRegistry | null },
  serviceRef: { current: null as MockSettingsService | null },
  undoableQueueRef: {
    current: null as null | {
      add: (...a: unknown[]) => Promise<"commit" | "cancel">;
      cancel: (id: string) => void;
    },
  },
  eventsRef: {
    current: null as null | {
      on: (event: string, cb: (payload: unknown) => void) => () => void;
      emit: (event: string, payload: unknown) => Promise<void>;
    },
  },
}));

vi.mock("@stackra/container/react", () => ({
  useInject: (token: symbol) => {
    const desc = token.toString();
    if (desc.includes("SETTINGS_SERVICE")) return serviceRef.current;
    if (desc.includes("SETTINGS_REGISTRY")) return registryRef.current;
    return null;
  },
  useOptionalInject: (token: symbol) => {
    const desc = token.toString();
    if (desc.includes("UNDOABLE_QUEUE")) return undoableQueueRef.current;
    if (desc.includes("EVENT_EMITTER")) return eventsRef.current;
    return null;
  },
}));

// ══════════════════════════════════════════════════════════════════
// Test scaffold
// ══════════════════════════════════════════════════════════════════

function setupService() {
  const registry = new MockSettingsRegistry();
  registry.registerFromSchema({
    key: "display",
    label: "Display",
    dto: null,
    fields: [
      { key: "compact", control: "toggle", label: "Compact", defaultValue: false },
      { key: "theme", control: "select", label: "Theme", defaultValue: "system" },
    ],
    groups: [],
  });
  registryRef.current = registry;
  serviceRef.current = new MockSettingsService(registry);
}

afterEach(() => {
  cleanup();
  registryRef.current = null;
  serviceRef.current = null;
  undoableQueueRef.current = null;
  eventsRef.current = null;
});

describe("useUpdateSettings — modes", () => {
  beforeEach(() => {
    setupService();
  });

  it("optimistic (default) — writes to the service, resolves immediately", async () => {
    const { result } = renderHook(() => useUpdateSettings<{ compact: boolean }>("display"));

    await act(async () => {
      await result.current.mutate({ compact: true });
    });

    expect(serviceRef.current!.getByKey("display")?.compact).toBe(true);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("pessimistic — awaits persist before resolving", async () => {
    // Spy on awaitPersist to prove the mutation awaits it.
    const spy = vi.spyOn(serviceRef.current!, "awaitPersist");

    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean }>("display", {
        mutationMode: "pessimistic",
      }),
    );

    await act(async () => {
      await result.current.mutate({ compact: true });
    });

    expect(spy).toHaveBeenCalledWith("display");
    expect(serviceRef.current!.getByKey("display")?.compact).toBe(true);
  });

  it("pessimistic — rolls back on persist failure", async () => {
    // Reject awaitPersist to simulate a network error.
    vi.spyOn(serviceRef.current!, "awaitPersist").mockRejectedValue(new Error("server rejected"));
    serviceRef.current!.setByKey("display", "theme", "dark"); // baseline

    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean; theme: string }>("display", {
        mutationMode: "pessimistic",
      }),
    );

    // Catch the mutation error inside `act` — the state updates are
    // committed regardless of whether the caller catches or rethrows.
    let caught: Error | null = null;
    await act(async () => {
      try {
        await result.current.mutate({ compact: true });
      } catch (err) {
        caught = err as Error;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toBe("server rejected");

    // The optimistic write happened but was rolled back — the
    // pre-mutation snapshot had { theme: 'dark' } (default: false
    // for `compact`).
    const state = serviceRef.current!.getByKey("display");
    expect(state?.compact).toBe(false);
    expect(state?.theme).toBe("dark");
    expect(result.current.error?.message).toBe("server rejected");
    expect(result.current.isSuccess).toBe(false);
  });

  it("undoable — commit path fires the persist through the queue", async () => {
    // Queue that always commits after a tick.
    undoableQueueRef.current = {
      add: async () => "commit" as const,
      cancel: () => undefined,
    };

    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean }>("display", {
        mutationMode: "undoable",
        undoableTimeout: 100,
        undoableLabel: "Compact toggled",
      }),
    );

    await act(async () => {
      await result.current.mutate({ compact: true });
    });

    expect(serviceRef.current!.getByKey("display")?.compact).toBe(true);
    expect(result.current.isSuccess).toBe(true);
  });

  it("undoable — cancel path rolls back and rejects", async () => {
    undoableQueueRef.current = {
      add: async () => "cancel" as const,
      cancel: () => undefined,
    };

    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean }>("display", {
        mutationMode: "undoable",
      }),
    );

    let caught: Error | null = null;
    await act(async () => {
      try {
        await result.current.mutate({ compact: true });
      } catch (err) {
        caught = err as Error;
      }
    });

    expect(caught?.message).toBe("mutationCancelled");
    // Cache rolled back to the pre-mutation snapshot — `compact`
    // is back to its default (false).
    expect(serviceRef.current!.getByKey("display")?.compact).toBe(false);
    expect(result.current.error?.message).toBe("mutationCancelled");
  });

  it("undoable — degrades to fire-and-forget when no queue is bound", async () => {
    // No undoableQueueRef.current — the queue peer is absent.
    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean }>("display", {
        mutationMode: "undoable",
      }),
    );

    await act(async () => {
      await result.current.mutate({ compact: true });
    });

    // The write went through, no cancel path, no rollback.
    expect(serviceRef.current!.getByKey("display")?.compact).toBe(true);
    expect(result.current.isSuccess).toBe(true);
  });
});

describe("useUpdateSettings — lifecycle", () => {
  beforeEach(() => {
    setupService();
  });

  it("resetState clears success + error + pending", async () => {
    const { result } = renderHook(() => useUpdateSettings<{ compact: boolean }>("display"));

    await act(async () => {
      await result.current.mutate({ compact: true });
    });
    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.resetState();
    });
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reset (defaults) clears the group values", async () => {
    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean; theme: string }>("display"),
    );

    await act(async () => {
      await result.current.mutate({ compact: true, theme: "dark" });
    });

    act(() => {
      result.current.reset();
    });

    // Reset clears the cache — reading returns defaults only.
    await waitFor(() => {
      const state = serviceRef.current!.getByKey("display");
      expect(state?.compact).toBe(false);
      expect(state?.theme).toBe("system");
    });
  });

  it("onSuccess + onSettled fire after a successful mutation", async () => {
    const onSuccess = vi.fn();
    const onSettled = vi.fn();

    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean }>("display", {
        onSuccess,
        onSettled,
      }),
    );

    await act(async () => {
      await result.current.mutate({ compact: true });
    });

    expect(onSuccess).toHaveBeenCalledWith({ compact: true });
    expect(onSettled).toHaveBeenCalledWith(null, { compact: true });
  });

  it("onError + onSettled fire when a mutation fails", async () => {
    vi.spyOn(serviceRef.current!, "awaitPersist").mockRejectedValue(new Error("broken"));
    const onError = vi.fn();
    const onSettled = vi.fn();

    const { result } = renderHook(() =>
      useUpdateSettings<{ compact: boolean }>("display", {
        mutationMode: "pessimistic",
        onError,
        onSettled,
      }),
    );

    await act(async () => {
      try {
        await result.current.mutate({ compact: true });
      } catch {
        // Expected — the mutation rejects.
      }
    });

    expect(onError).toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalled();
    expect(onSettled.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });
});
