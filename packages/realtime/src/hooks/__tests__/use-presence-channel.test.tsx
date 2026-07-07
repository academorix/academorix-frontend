/**
 * @file use-presence-channel.test.tsx
 * @module @academorix/realtime/hooks/__tests__/use-presence-channel.test
 *
 * @description
 * Covers the {@link usePresenceChannel} hook against a stub channel
 * that captures the `here` / `joining` / `leaving` callbacks so tests
 * can synthesise presence transitions. Asserts the returned `members`
 * array reflects each transition, the caller's optional callbacks
 * fire, and the cleanup path calls `client.leave("presence-name")`.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePresenceChannel } from "../use-presence-channel";

import type { RealtimeChannel, RealtimeClient } from "../../client/realtime-client.type";

interface Member {
  readonly id: string;
  readonly name: string;
}

interface CapturedCallbacks {
  here: ((members: unknown[]) => void) | null;
  joining: ((member: unknown) => void) | null;
  leaving: ((member: unknown) => void) | null;
}

interface Harness {
  readonly client: RealtimeClient;
  readonly captured: CapturedCallbacks;
  readonly channel: RealtimeChannel & {
    listen: ReturnType<typeof vi.fn>;
  };
}

/**
 * Builds a stub presence channel that stores the caller-provided
 * `here` / `joining` / `leaving` callbacks so we can invoke them
 * from the test to simulate broadcasts.
 */
function harness(): Harness {
  const captured: CapturedCallbacks = { here: null, joining: null, leaving: null };

  const channel: RealtimeChannel & { listen: ReturnType<typeof vi.fn> } = {
    listen: vi.fn().mockReturnThis(),
    listenToAll: vi.fn().mockReturnThis(),
    stopListening: vi.fn().mockReturnThis(),
    here: vi.fn((cb: (members: unknown[]) => void): RealtimeChannel => {
      captured.here = cb;

      return channel;
    }),
    joining: vi.fn((cb: (member: unknown) => void): RealtimeChannel => {
      captured.joining = cb;

      return channel;
    }),
    leaving: vi.fn((cb: (member: unknown) => void): RealtimeChannel => {
      captured.leaving = cb;

      return channel;
    }),
  };

  const client: RealtimeClient = {
    channel: vi.fn().mockReturnValue(channel),
    private: vi.fn().mockReturnValue(channel),
    presence: vi.fn().mockReturnValue(channel),
    leave: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };

  return { client, captured, channel };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePresenceChannel — initial state", () => {
  it("seeds the members array to empty before any `here` callback fires", () => {
    const h = harness();

    const { result } = renderHook(() => usePresenceChannel<Member>(h.client, "session.42"));

    expect(result.current.members).toEqual([]);
  });

  it("calls the presence method on the client with the given channel name", () => {
    const h = harness();

    renderHook(() => usePresenceChannel<Member>(h.client, "session.42"));

    expect(h.client.presence).toHaveBeenCalledWith("session.42");
  });
});

describe("usePresenceChannel — `here` callback", () => {
  it("populates members from the initial roster", () => {
    const h = harness();

    const { result } = renderHook(() => usePresenceChannel<Member>(h.client, "session.42"));

    act(() => {
      h.captured.here?.([
        { id: "u-1", name: "Sam" },
        { id: "u-2", name: "Alex" },
      ]);
    });

    expect(result.current.members).toEqual([
      { id: "u-1", name: "Sam" },
      { id: "u-2", name: "Alex" },
    ]);
  });

  it("calls the caller's onHere handler with the initial roster", () => {
    const h = harness();
    const onHere = vi.fn();

    renderHook(() => usePresenceChannel<Member>(h.client, "session.42", { onHere }));

    const initial = [{ id: "u-1", name: "Sam" }];

    act(() => {
      h.captured.here?.(initial);
    });

    expect(onHere).toHaveBeenCalledWith(initial);
  });
});

describe("usePresenceChannel — `joining` callback", () => {
  it("appends the new member to the members array", () => {
    const h = harness();

    const { result } = renderHook(() => usePresenceChannel<Member>(h.client, "session.42"));

    act(() => {
      h.captured.here?.([{ id: "u-1", name: "Sam" }]);
    });

    act(() => {
      h.captured.joining?.({ id: "u-2", name: "Alex" });
    });

    expect(result.current.members).toEqual([
      { id: "u-1", name: "Sam" },
      { id: "u-2", name: "Alex" },
    ]);
  });

  it("calls the caller's onJoining handler with the new member", () => {
    const h = harness();
    const onJoining = vi.fn();

    renderHook(() => usePresenceChannel<Member>(h.client, "session.42", { onJoining }));

    const newcomer = { id: "u-3", name: "Jordan" };

    act(() => {
      h.captured.joining?.(newcomer);
    });

    expect(onJoining).toHaveBeenCalledWith(newcomer);
  });
});

describe("usePresenceChannel — `leaving` callback", () => {
  it("filters the departing member out of the members array", () => {
    const h = harness();

    const initial = [
      { id: "u-1", name: "Sam" },
      { id: "u-2", name: "Alex" },
    ];

    const { result } = renderHook(() => usePresenceChannel<Member>(h.client, "session.42"));

    // Seed the members list with two people…
    act(() => {
      h.captured.here?.(initial);
    });

    // …then have Alex leave via the SAME object reference the hook
    // saw come in. The source filters by reference equality
    // (`existing !== typed`), so passing the same reference makes
    // this a real integration test rather than a property-equality
    // test that would silently pass on `!=`.
    act(() => {
      h.captured.leaving?.(initial[1]);
    });

    expect(result.current.members).toEqual([{ id: "u-1", name: "Sam" }]);
  });

  it("calls the caller's onLeaving handler with the departing member", () => {
    const h = harness();
    const onLeaving = vi.fn();

    renderHook(() => usePresenceChannel<Member>(h.client, "session.42", { onLeaving }));

    const leaver = { id: "u-2", name: "Alex" };

    act(() => {
      h.captured.leaving?.(leaver);
    });

    expect(onLeaving).toHaveBeenCalledWith(leaver);
  });
});

describe("usePresenceChannel — custom event handlers", () => {
  it("wires every entry of the `handlers` map through channel.listen", () => {
    const h = harness();
    const started = vi.fn();
    const ended = vi.fn();

    renderHook(() =>
      usePresenceChannel<Member>(h.client, "session.42", {
        handlers: { started, ended },
      }),
    );

    expect(h.channel.listen).toHaveBeenCalledWith("started", started);
    expect(h.channel.listen).toHaveBeenCalledWith("ended", ended);
  });
});

describe("usePresenceChannel — cleanup", () => {
  it("calls client.leave('presence-<channelName>') on unmount", () => {
    const h = harness();

    const { unmount } = renderHook(() => usePresenceChannel<Member>(h.client, "session.42"));

    unmount();

    expect(h.client.leave).toHaveBeenCalledWith("presence-session.42");
  });
});
