/**
 * @file use-channel.test.tsx
 * @module @academorix/realtime/hooks/__tests__/use-channel.test
 *
 * @description
 * Covers the {@link useChannel} hook: mount → `client.channel(name)` +
 * one `listen(event, cb)` per handler, unmount → `client.leave(name)`,
 * empty channel name → no subscription, changing name → tear down the
 * old channel and re-subscribe to the new one.
 */

import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useChannel } from "../use-channel";

import type { RealtimeChannel, RealtimeClient } from "../../client/realtime-client.type";

/** Builds a stub client + channel pair with `vi.fn()` methods for observation. */
function stubClient(): {
  client: RealtimeClient;
  channel: RealtimeChannel & { listen: ReturnType<typeof vi.fn> };
} {
  const channel = {
    listen: vi.fn().mockReturnThis(),
    listenToAll: vi.fn().mockReturnThis(),
    stopListening: vi.fn().mockReturnThis(),
  } as RealtimeChannel & { listen: ReturnType<typeof vi.fn> };

  const client: RealtimeClient = {
    channel: vi.fn().mockReturnValue(channel),
    private: vi.fn().mockReturnValue(channel),
    presence: vi.fn().mockReturnValue(channel),
    leave: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };

  return { client, channel };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useChannel — subscribe on mount", () => {
  it("calls client.channel(name).listen(event, callback) for each handler", () => {
    const { client, channel } = stubClient();
    const handler = vi.fn();

    renderHook(() => useChannel(client, "attendance.updates", { "attendance.marked": handler }));

    expect(client.channel).toHaveBeenCalledWith("attendance.updates");
    expect(channel.listen).toHaveBeenCalledWith("attendance.marked", handler);
  });

  it("subscribes to every handler in the map", () => {
    const { client, channel } = stubClient();
    const first = vi.fn();
    const second = vi.fn();

    renderHook(() => useChannel(client, "session.42", { started: first, ended: second }));

    expect(channel.listen).toHaveBeenCalledWith("started", first);
    expect(channel.listen).toHaveBeenCalledWith("ended", second);
    expect(channel.listen).toHaveBeenCalledTimes(2);
  });
});

describe("useChannel — unsubscribe on unmount", () => {
  it("calls client.leave(name) when the consumer unmounts", () => {
    const { client } = stubClient();
    const { unmount } = renderHook(() => useChannel(client, "chan-1", {}));

    unmount();

    expect(client.leave).toHaveBeenCalledWith("chan-1");
  });
});

describe("useChannel — empty channel name", () => {
  it("skips subscription entirely when the name is empty", () => {
    const { client, channel } = stubClient();

    const { unmount } = renderHook(() => useChannel(client, "", { evt: vi.fn() }));

    expect(client.channel).not.toHaveBeenCalled();
    expect(channel.listen).not.toHaveBeenCalled();

    unmount();

    // Nothing was subscribed, so unmount must not call `leave`.
    expect(client.leave).not.toHaveBeenCalled();
  });
});

describe("useChannel — channel name change", () => {
  it("leaves the old channel and re-subscribes when the name changes", () => {
    const { client, channel } = stubClient();

    const { rerender } = renderHook<void, { readonly name: string }>(
      ({ name }) => useChannel(client, name, { evt: vi.fn() }),
      { initialProps: { name: "chan-a" } },
    );

    expect(client.channel).toHaveBeenCalledWith("chan-a");
    expect(channel.listen).toHaveBeenCalledTimes(1);

    rerender({ name: "chan-b" });

    // React runs the effect's cleanup (leave) BEFORE running the new
    // effect (channel + listen), matching the strict-mode lifecycle.
    expect(client.leave).toHaveBeenCalledWith("chan-a");
    expect(client.channel).toHaveBeenCalledWith("chan-b");
    expect(channel.listen).toHaveBeenCalledTimes(2);
  });
});
