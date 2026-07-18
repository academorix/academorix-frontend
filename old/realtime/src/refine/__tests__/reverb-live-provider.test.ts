/**
 * @file reverb-live-provider.test.ts
 * @module @academorix/realtime/refine/__tests__/reverb-live-provider.test
 *
 * @description
 * Covers the Refine `LiveProvider` adapter over Reverb:
 *
 *  - The private `deriveEventType` helper is exercised INDIRECTLY
 *    through `subscribe({ types: ["*"] })` — every event flows through
 *    the callback and we assert the emitted `type` string. That's the
 *    externally observable contract; the source keeps the helper
 *    private for encapsulation.
 *  - `subscribe` wires the channel via `listenToAll` and filters events
 *    against the caller-supplied `types` array.
 *  - `unsubscribe` calls `client.leave(channel)`.
 *  - The noop provider returns undefined and no-ops.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createNoopLiveProvider, createReverbLiveProvider } from "../create-reverb-live-provider";

import type { RealtimeChannel, RealtimeClient } from "../../client/realtime-client.type";
import type { LiveEvent } from "../reverb-live-provider.type";

interface ChannelHarness {
  readonly client: RealtimeClient;
  readonly leave: ReturnType<typeof vi.fn>;
  /** Fires the captured `listenToAll` callback as if a broadcast arrived. */
  emit: (eventName: string, payload: unknown) => void;
}

/**
 * Builds a stub client that captures the `listenToAll` callback so
 * the test can synthesise broadcasts and observe how the provider
 * reacts.
 */
function harness(): ChannelHarness {
  let capturedCallback: ((eventName: string, payload: unknown) => void) | null = null;

  const channel: RealtimeChannel = {
    listen: vi.fn().mockReturnThis(),
    stopListening: vi.fn().mockReturnThis(),
    listenToAll: vi.fn((cb: (eventName: string, payload: unknown) => void): RealtimeChannel => {
      capturedCallback = cb;

      return channel;
    }),
  };

  const leave = vi.fn();
  const client: RealtimeClient = {
    channel: vi.fn().mockReturnValue(channel),
    private: vi.fn().mockReturnValue(channel),
    presence: vi.fn().mockReturnValue(channel),
    leave,
    disconnect: vi.fn().mockResolvedValue(undefined),
  };

  return {
    client,
    leave,
    emit(eventName, payload): void {
      if (!capturedCallback) {
        throw new Error("listenToAll was never called — no callback to emit through");
      }

      capturedCallback(eventName, payload);
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createReverbLiveProvider — event-type derivation", () => {
  let events: LiveEvent[];
  let harnessInstance: ChannelHarness;

  beforeEach(() => {
    events = [];
    harnessInstance = harness();

    const provider = createReverbLiveProvider(harnessInstance.client);

    provider.subscribe({
      channel: "resources.session",
      types: ["*"],
      callback: (event): void => {
        events.push(event);
      },
    });
  });

  it("maps *Created event names to Refine `created`", () => {
    harnessInstance.emit("SessionCreated", { ids: ["s-1"] });

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("created");
  });

  it("maps *Updated event names to Refine `updated`", () => {
    harnessInstance.emit("SessionUpdated", { ids: ["s-1"] });

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("updated");
  });

  it("maps *Deleted event names to Refine `deleted`", () => {
    harnessInstance.emit("SessionDeleted", { ids: ["s-1"] });

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("deleted");
  });

  it("falls back to `*` for event names that don't match a known verb", () => {
    harnessInstance.emit("SessionArbitrary", { ids: ["s-1"] });

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("*");
  });

  it("forwards the payload verbatim and stamps a Date", () => {
    harnessInstance.emit("SessionCreated", { ids: ["s-1", "s-2"] });

    expect(events[0]?.payload).toEqual({ ids: ["s-1", "s-2"] });
    expect(events[0]?.channel).toBe("resources.session");
    expect(events[0]?.date).toBeInstanceOf(Date);
  });

  it("normalises non-object payloads (e.g. string) to an empty object", () => {
    harnessInstance.emit("SessionCreated", "raw-string");

    expect(events[0]?.payload).toEqual({});
  });
});

describe("createReverbLiveProvider — subscription plumbing", () => {
  it("subscribes to the channel via listenToAll on subscribe(...)", () => {
    const h = harness();
    const provider = createReverbLiveProvider(h.client);

    provider.subscribe({
      channel: "resources.session",
      types: ["created"],
      callback: vi.fn(),
    });

    expect(h.client.channel).toHaveBeenCalledWith("resources.session");
  });

  it("fires the callback only for events matching the caller's `types` filter", () => {
    const h = harness();
    const provider = createReverbLiveProvider(h.client);
    const callback = vi.fn();

    provider.subscribe({
      channel: "resources.session",
      types: ["created"],
      callback,
    });

    // A matching event: fires.
    h.emit("SessionCreated", { ids: ["s-1"] });
    expect(callback).toHaveBeenCalledTimes(1);

    // A NON-matching event: does not fire.
    h.emit("SessionUpdated", { ids: ["s-1"] });
    expect(callback).toHaveBeenCalledTimes(1);

    h.emit("SessionDeleted", { ids: ["s-1"] });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("passes through every event when `types` contains `*`", () => {
    const h = harness();
    const provider = createReverbLiveProvider(h.client);
    const callback = vi.fn();

    provider.subscribe({
      channel: "resources.session",
      types: ["*"],
      callback,
    });

    h.emit("SessionCreated", {});
    h.emit("SessionUpdated", {});
    h.emit("SomethingWeird", {});

    expect(callback).toHaveBeenCalledTimes(3);
  });
});

describe("createReverbLiveProvider — unsubscribe", () => {
  it("leaves the channel on unsubscribe with the subscription handle", () => {
    const h = harness();
    const provider = createReverbLiveProvider(h.client);

    const handle = provider.subscribe({
      channel: "resources.session",
      types: ["*"],
      callback: vi.fn(),
    });

    provider.unsubscribe(handle);

    expect(h.leave).toHaveBeenCalledWith("resources.session");
  });

  it("no-ops silently when handed an unknown subscription handle", () => {
    const h = harness();
    const provider = createReverbLiveProvider(h.client);

    expect(() => provider.unsubscribe(undefined)).not.toThrow();
    expect(() => provider.unsubscribe({})).not.toThrow();
    expect(h.leave).not.toHaveBeenCalled();
  });
});

describe("createNoopLiveProvider", () => {
  it("returns undefined from subscribe(...) so Refine treats it as inert", () => {
    const provider = createNoopLiveProvider();

    const handle = provider.subscribe({
      channel: "resources.session",
      types: ["*"],
      callback: vi.fn(),
    });

    expect(handle).toBeUndefined();
  });

  it("swallows every unsubscribe(...) call without side effects", () => {
    const provider = createNoopLiveProvider();

    expect(() => provider.unsubscribe(undefined)).not.toThrow();
    expect(() => provider.unsubscribe({ channel: "anything" })).not.toThrow();
  });
});
