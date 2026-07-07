/**
 * @file create-realtime-client.test.ts
 * @module @academorix/realtime/client/__tests__/create-realtime-client.test
 *
 * @description
 * Covers {@link createRealtimeClient} end-to-end:
 *   - The public surface (`channel` / `private` / `presence` / `leave` /
 *     `disconnect`).
 *   - The lazy proxy — chainable + records calls before the Echo
 *     transport resolves and replays them on the real channel.
 *   - The SSR guard (`typeof window === "undefined"` → every method
 *     no-ops silently).
 *   - `disconnect()` awaits Echo before tearing it down.
 *
 * ## Mocking strategy
 *
 * `laravel-echo` + `pusher-js` are loaded via dynamic `import(...)`
 * inside the client factory. `vi.mock(id, factory)` intercepts those
 * imports and gives us a fake Echo constructor that returns a
 * channel harness we control. That harness records every method
 * call so tests can assert the queued proxy calls were replayed.
 *
 * Every mock module registration is hoisted by Vitest to the top of
 * the file, so importing the SUT (`createRealtimeClient`) inside a
 * `beforeAll` or top-level import both work — the mock is in place
 * first either way.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Records every channel call across the file. `beforeEach` clears
// it so each test starts from a clean slate.
interface FakeChannel {
  readonly listen: ReturnType<typeof vi.fn>;
  readonly listenToAll: ReturnType<typeof vi.fn>;
  readonly stopListening: ReturnType<typeof vi.fn>;
  readonly here: ReturnType<typeof vi.fn>;
  readonly joining: ReturnType<typeof vi.fn>;
  readonly leaving: ReturnType<typeof vi.fn>;
}

interface FakeEchoInstance {
  readonly channel: ReturnType<typeof vi.fn>;
  readonly private: ReturnType<typeof vi.fn>;
  readonly presence: ReturnType<typeof vi.fn>;
  readonly leave: ReturnType<typeof vi.fn>;
  readonly disconnect: ReturnType<typeof vi.fn>;
}

interface EchoRegistry {
  echo: FakeEchoInstance | null;
  ctorArgs: unknown;
  channelsByName: Map<string, FakeChannel>;
  channelBuilder: (name: string) => FakeChannel;
}

/**
 * Tests read + reset this via the accessor exported below. Kept in a
 * closure so it survives `vi.mock`'s hoisting.
 */
const registry: EchoRegistry = {
  echo: null,
  ctorArgs: undefined,
  channelsByName: new Map(),
  channelBuilder: buildFakeChannel,
};

function buildFakeChannel(): FakeChannel {
  return {
    listen: vi.fn().mockReturnThis(),
    listenToAll: vi.fn().mockReturnThis(),
    stopListening: vi.fn().mockReturnThis(),
    here: vi.fn().mockReturnThis(),
    joining: vi.fn().mockReturnThis(),
    leaving: vi.fn().mockReturnThis(),
  };
}

function getOrCreateChannel(name: string): FakeChannel {
  const existing = registry.channelsByName.get(name);

  if (existing) {
    return existing;
  }

  const fresh = registry.channelBuilder(name);

  registry.channelsByName.set(name, fresh);

  return fresh;
}

// Register the Echo mock. Vitest hoists this to the top of the module
// before any other statements run.
vi.mock("laravel-echo", () => {
  // The mocked default export is invoked as `new EchoConstructor(config)`.
  const EchoConstructor = vi.fn(function EchoConstructor(this: FakeEchoInstance, args: unknown) {
    registry.ctorArgs = args;

    const instance: FakeEchoInstance = {
      channel: vi.fn((name: string): FakeChannel => getOrCreateChannel(name)),
      private: vi.fn((name: string): FakeChannel => getOrCreateChannel(`private-${name}`)),
      presence: vi.fn((name: string): FakeChannel => getOrCreateChannel(`presence-${name}`)),
      leave: vi.fn(),
      disconnect: vi.fn(),
    };

    registry.echo = instance;

    // Return the plain object rather than `this` so `new EchoConstructor()`
    // yields the mock instance regardless of how the SUT calls it.
    return instance;
  });

  return { default: EchoConstructor };
});

// Register the Pusher mock. The realtime client just parks it on
// `globalThis.Pusher` — anything with the right shape works.
vi.mock("pusher-js", () => {
  return { default: vi.fn() };
});

// SUT is imported AFTER `vi.mock` calls above so the mocks are in
// place at first-load time.
import { createRealtimeClient } from "../create-realtime-client";

import type { RealtimeConfig } from "../realtime-config.type";

/** Standard config used by every test that doesn't need overrides. */
const CONFIG: RealtimeConfig = {
  appKey: "test-key",
  host: "localhost",
  port: 8080,
  scheme: "http",
  authEndpoint: "https://example.test/broadcasting/auth",
  getAuthHeaders: () => ({ Authorization: "Bearer test-token" }),
};

/**
 * Waits until Echo has been loaded + constructed. The dynamic
 * `import(...)` resolves on a microtask, so a single `await` on a
 * tick queue is enough in practice — but `vi.waitFor` is more
 * resilient across Vitest versions.
 */
async function waitForEchoReady(): Promise<void> {
  await vi.waitFor(() => {
    if (!registry.echo) {
      throw new Error("Echo has not been constructed yet");
    }
  });
}

beforeEach(() => {
  registry.echo = null;
  registry.ctorArgs = undefined;
  registry.channelsByName.clear();
  registry.channelBuilder = buildFakeChannel;
});

afterEach(() => {
  vi.unstubAllGlobals();
  // Clean up the Pusher global the client sets on the window.
  delete (globalThis as { Pusher?: unknown }).Pusher;
});

describe("createRealtimeClient — public surface", () => {
  it("returns an object exposing channel/private/presence/leave/disconnect", () => {
    const client = createRealtimeClient(CONFIG);

    expect(typeof client.channel).toBe("function");
    expect(typeof client.private).toBe("function");
    expect(typeof client.presence).toBe("function");
    expect(typeof client.leave).toBe("function");
    expect(typeof client.disconnect).toBe("function");
  });

  it("returns a chainable proxy from channel(name).listen(...) — no await required", () => {
    const client = createRealtimeClient(CONFIG);

    const proxy = client.channel("chan");
    const chained = proxy.listen("evt", () => undefined);

    // The proxy returns itself so `.listen(...).listen(...)` chains
    // fluently even before Echo has resolved.
    expect(chained).toBe(proxy);
  });
});

describe("createRealtimeClient — lazy queue replay", () => {
  it("replays queued listen calls on the real channel once Echo resolves", async () => {
    const client = createRealtimeClient(CONFIG);
    const callback = vi.fn();

    // Call `.listen(...)` synchronously, before Echo has finished
    // loading. The proxy must queue it.
    client.channel("attendance.updates").listen("attendance.marked", callback);

    await waitForEchoReady();

    // Once Echo resolved, the queued op should have fired on the
    // fake channel object exposed by the mock.
    const fake = registry.channelsByName.get("attendance.updates");

    expect(fake).toBeDefined();
    expect(fake?.listen).toHaveBeenCalledWith("attendance.marked", callback);
  });

  it("replays queued listen calls in order across multiple invocations", async () => {
    const client = createRealtimeClient(CONFIG);
    const first = vi.fn();
    const second = vi.fn();

    const proxy = client.channel("multi");

    proxy.listen("evt-a", first);
    proxy.listen("evt-b", second);

    await waitForEchoReady();

    const fake = registry.channelsByName.get("multi");

    expect(fake?.listen).toHaveBeenNthCalledWith(1, "evt-a", first);
    expect(fake?.listen).toHaveBeenNthCalledWith(2, "evt-b", second);
  });

  it("invokes ops directly (no queue) once Echo has resolved", async () => {
    const client = createRealtimeClient(CONFIG);

    // Trigger the Echo load and wait for it.
    client.channel("first").listen("a", vi.fn());
    await waitForEchoReady();

    // Now grab a fresh proxy — under the hood Echo is already loaded,
    // so the proxy calls should pass through directly.
    const cb = vi.fn();

    client.channel("second").listen("b", cb);

    await vi.waitFor(() => {
      const fake = registry.channelsByName.get("second");

      expect(fake?.listen).toHaveBeenCalledWith("b", cb);
    });
  });

  it("passes the config through to the Echo constructor with the expected shape", async () => {
    const client = createRealtimeClient(CONFIG);

    // Kick the lazy load by touching a subscription.
    client.channel("any");
    await waitForEchoReady();

    expect(registry.ctorArgs).toMatchObject({
      broadcaster: "reverb",
      key: "test-key",
      wsHost: "localhost",
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false, // scheme "http"
      authEndpoint: "https://example.test/broadcasting/auth",
    });
  });
});

describe("createRealtimeClient — disconnect", () => {
  it("awaits Echo load and calls echo.disconnect()", async () => {
    const client = createRealtimeClient(CONFIG);

    // Trigger Echo load by subscribing.
    client.channel("chan").listen("evt", vi.fn());

    await client.disconnect();

    expect(registry.echo?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("kicks off the Echo load itself if no prior subscription touched it", async () => {
    const client = createRealtimeClient(CONFIG);

    await client.disconnect();

    // The disconnect path goes through `getEchoPromise()`, which
    // constructs Echo on first access — so even without a prior
    // subscription the constructor should have been invoked.
    expect(registry.echo?.disconnect).toHaveBeenCalledTimes(1);
  });
});

describe("createRealtimeClient — leave", () => {
  it("routes a leave request through the resolved Echo instance", async () => {
    const client = createRealtimeClient(CONFIG);

    client.channel("chan").listen("evt", vi.fn());
    await waitForEchoReady();

    client.leave("chan");

    // `leave` is async internally — wait for the next microtask.
    await vi.waitFor(() => {
      expect(registry.echo?.leave).toHaveBeenCalledWith("chan");
    });
  });
});

describe("createRealtimeClient — SSR safety", () => {
  it("no-ops every method when `window` is undefined", async () => {
    // Simulate an SSR environment. The client's `loadEcho` guards on
    // `typeof window === "undefined"` and returns `Promise.resolve(null)`,
    // so every subsequent op should silently drop.
    vi.stubGlobal("window", undefined);

    // Sanity: the guard we're testing.
    expect(typeof window).toBe("undefined");

    const client = createRealtimeClient(CONFIG);
    const proxy = client.channel("chan");

    expect(() => proxy.listen("evt", vi.fn())).not.toThrow();
    expect(() => proxy.listenToAll(vi.fn())).not.toThrow();
    expect(() => proxy.stopListening("evt")).not.toThrow();
    expect(() => client.leave("chan")).not.toThrow();

    await expect(client.disconnect()).resolves.toBeUndefined();

    // Nothing ever loaded the real Echo — the mock constructor was
    // never invoked, so no fake channels exist.
    expect(registry.echo).toBeNull();
    expect(registry.channelsByName.size).toBe(0);
  });
});
