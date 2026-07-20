/**
 * @file realtime-manager.test.ts
 * @module @stackra/realtime/__tests__/unit
 * @description Behavioural tests for `RealtimeManager` — connection
 *   registration, lifecycle events, driver-facing reporters, and
 *   error paths.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { REALTIME_EVENTS } from "@stackra/contracts";

import { RealtimeManager } from "@/core/services/realtime-manager.service";
import { RealtimeConnectionError } from "@/core/errors";
import type { IRealtimeModuleOptions } from "@/core/interfaces";

import { RecordingEmitter } from "../support/recording-emitter";
import { StubConnection } from "../support/stub-connection";

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function buildManager(
  options: Partial<IRealtimeModuleOptions> & { emitter?: RecordingEmitter } = {},
) {
  const emitter = options.emitter ?? new RecordingEmitter();
  const config: IRealtimeModuleOptions = {
    default: options.default ?? "main",
    connections: options.connections ?? {
      main: { driver: "test", url: "wss://x" },
    },
    emitLifecycleEvents: options.emitLifecycleEvents,
  };
  const manager = new RealtimeManager(config, emitter);
  return { manager, emitter };
}

// ════════════════════════════════════════════════════════════════════════════
// Specs
// ════════════════════════════════════════════════════════════════════════════

describe("RealtimeManager — connection registration", () => {
  it("emits CONNECTED when registerConnection stores a driver", async () => {
    const { manager, emitter } = buildManager();

    const conn = new StubConnection();
    manager.registerConnection("main", conn);

    const resolved = await manager.connection("main");
    expect(resolved).toBe(conn);
    expect(emitter.emitted).toContainEqual({
      event: REALTIME_EVENTS.CONNECTED,
      payload: { connection: "main" },
    });
  });

  it("throws RealtimeConnectionError when no driver is registered for the name", async () => {
    const { manager } = buildManager();
    await expect(manager.connection("main")).rejects.toBeInstanceOf(RealtimeConnectionError);
    await expect(manager.connection("main")).rejects.toThrow(/not registered/);
  });

  it("uses getDefaultDriver() when no name is passed to connection()", async () => {
    const { manager } = buildManager({ default: "primary" });
    manager.registerConnection("primary", new StubConnection());

    // connection() without a name resolves the configured default.
    const resolved = await manager.connection();
    expect(resolved).toBeDefined();
    expect(manager.getDefaultDriver()).toBe("primary");
  });

  it("returns the same connection instance on repeated resolve", async () => {
    const { manager } = buildManager();
    const conn = new StubConnection();
    manager.registerConnection("main", conn);

    const a = await manager.connection("main");
    const b = await manager.connection("main");
    expect(a).toBe(b);
  });
});

describe("RealtimeManager — disconnect", () => {
  it("emits DISCONNECTED with reason=manual and drops the cache", async () => {
    const { manager, emitter } = buildManager();
    const conn = new StubConnection();
    manager.registerConnection("main", conn);
    emitter.reset();

    await manager.disconnect("main");

    expect(conn.disconnected).toBe(true);
    expect(emitter.emitted).toContainEqual({
      event: REALTIME_EVENTS.DISCONNECTED,
      payload: { connection: "main", reason: "manual" },
    });

    // After disconnect the connection is unregistered — resolve throws again.
    await expect(manager.connection("main")).rejects.toBeInstanceOf(RealtimeConnectionError);
  });

  it("disconnect(name) is a no-op when the name is not registered", async () => {
    const { manager, emitter } = buildManager();
    // No connection registered — disconnect must not throw and must not emit.
    await manager.disconnect("unregistered");
    expect(emitter.emitted).toHaveLength(0);
  });

  it("disconnectAll closes every registered connection", async () => {
    const { manager } = buildManager({
      connections: {
        main: { driver: "test" },
        secondary: { driver: "test" },
      },
    });
    const first = new StubConnection();
    const second = new StubConnection();
    manager.registerConnection("main", first);
    manager.registerConnection("secondary", second);

    await manager.disconnectAll();
    expect(first.disconnected).toBe(true);
    expect(second.disconnected).toBe(true);
  });
});

describe("RealtimeManager — driver-facing reporters", () => {
  let manager: RealtimeManager;
  let emitter: RecordingEmitter;

  beforeEach(() => {
    ({ manager, emitter } = buildManager());
  });

  it("reportReconnecting emits RECONNECTING with attempt count", () => {
    manager.reportReconnecting("main", 3);
    expect(emitter.emitted).toContainEqual({
      event: REALTIME_EVENTS.RECONNECTING,
      payload: { connection: "main", attempt: 3 },
    });
  });

  it("reportError emits ERROR and serialises Error instances", () => {
    manager.reportError("main", new Error("socket closed"));
    expect(emitter.emitted).toContainEqual({
      event: REALTIME_EVENTS.ERROR,
      payload: { connection: "main", error: "socket closed" },
    });
  });

  it("reportError converts non-Error values via String()", () => {
    manager.reportError("main", { code: 42 });
    expect(emitter.emitted).toContainEqual({
      event: REALTIME_EVENTS.ERROR,
      payload: { connection: "main", error: "[object Object]" },
    });
  });

  it("reportMessage emits MESSAGE with channel + event + data", () => {
    manager.reportMessage("main", "orders", "created", { id: 42 });
    expect(emitter.emitted).toContainEqual({
      event: REALTIME_EVENTS.MESSAGE,
      payload: { connection: "main", channel: "orders", event: "created", data: { id: 42 } },
    });
  });
});

describe("RealtimeManager — fail-soft emitter", () => {
  it("never propagates a listener throw out of emit()", () => {
    // A subscriber that throws must not break the manager operation.
    const throwingEmitter = {
      emit: () => {
        throw new Error("subscriber exploded");
      },
      on: () => () => {},
      eventNames: () => [],
      listenerCount: () => 0,
      removeAllListeners: () => {},
    };

    const config: IRealtimeModuleOptions = {
      default: "main",
      connections: { main: { driver: "test" } },
    };
    const manager = new RealtimeManager(config, throwingEmitter);

    // Each reporter would emit — none should escape.
    expect(() => manager.reportError("main", new Error("x"))).not.toThrow();
    expect(() => manager.reportReconnecting("main", 1)).not.toThrow();
    expect(() => manager.reportMessage("main", "c", "e", {})).not.toThrow();
  });

  it("operates without an event emitter at all", async () => {
    const config: IRealtimeModuleOptions = {
      default: "main",
      connections: { main: { driver: "test" } },
    };
    const manager = new RealtimeManager(config);
    const conn = new StubConnection();

    // No emitter injected — every call is a no-op emit but the connection
    // still registers and resolves.
    manager.registerConnection("main", conn);
    const resolved = await manager.connection("main");
    expect(resolved).toBe(conn);
  });
});

describe("RealtimeManager — introspection", () => {
  it("getConnectionNames returns every configured connection", () => {
    const { manager } = buildManager({
      connections: {
        main: { driver: "test" },
        analytics: { driver: "test" },
        chat: { driver: "test" },
      },
    });

    expect(manager.getConnectionNames().sort()).toEqual(["analytics", "chat", "main"]);
  });
});
