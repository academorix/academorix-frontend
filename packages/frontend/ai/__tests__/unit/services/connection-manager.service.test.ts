/**
 * @file connection-manager.service.test.ts
 * @description Unit tests for {@link ConnectionManager}: composed state
 *   overlay (transport + offline), reconnect scheduling with bounded
 *   backoff, resume-context preservation across a run, and the
 *   `CONNECTION_CHANGED` event emission (Req 24.1–24.6).
 */

import { describe, expect, it, vi } from "vitest";
import {
  AI_EVENTS,
  AiConnectionState,
  type IAiConfig,
  type IAiTransport,
  type IEventEmitter,
  type INetworkDetector,
  type INetworkStatus,
} from "@stackra/contracts";

import { ConnectionManager } from "@/core/services/connection-manager.service";

// ── Test doubles ─────────────────────────────────────────────────────────

class FakeTransport implements IAiTransport {
  public state: AiConnectionState = AiConnectionState.Disconnected;
  private readonly listeners = new Set<(s: AiConnectionState) => void>();

  public stream(): AsyncIterable<string> {
    // eslint-disable-next-line require-yield
    return (async function* () {
      /* not needed for these tests */
    })();
  }
  public request<T>(): Promise<T> {
    return Promise.resolve(undefined as unknown as T);
  }
  public onStateChange(listener: (s: AiConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  public setState(next: AiConnectionState): void {
    this.state = next;
    for (const listener of this.listeners) listener(next);
  }
}

class FakeDetector implements INetworkDetector {
  private online = true;
  private readonly subs = new Set<(status: INetworkStatus) => void>();
  public isOnline(): boolean {
    return this.online;
  }
  public async getStatus(): Promise<INetworkStatus> {
    return { isOnline: this.online };
  }
  public subscribe(cb: (status: INetworkStatus) => void): () => void {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  }
  public flip(online: boolean): void {
    this.online = online;
    for (const cb of this.subs) cb({ isOnline: online });
  }
}

const baseConfig: IAiConfig = {
  baseUrl: "https://api.example.com",
  authProvider: {
    getCredentials: () => Promise.resolve({}),
    refresh: () => Promise.resolve({}),
  },
  retryPolicy: { maxAttempts: 4, baseMs: 100, capMs: 1_000 },
};

function makeManager(
  overrides: {
    transport?: IAiTransport;
    detector?: INetworkDetector;
    events?: IEventEmitter;
    config?: IAiConfig;
  } = {},
): ConnectionManager {
  const manager = new ConnectionManager(
    overrides.config ?? baseConfig,
    overrides.transport,
    overrides.detector,
    overrides.events,
  );
  manager.onModuleInit();
  return manager;
}

describe("ConnectionManager", () => {
  describe("state overlay (Req 24.1, 24.5)", () => {
    it("starts Disconnected with no transport bound", () => {
      const manager = makeManager();
      expect(manager.state).toBe(AiConnectionState.Disconnected);
      expect(manager.isConnected).toBe(false);
    });

    it("mirrors the transport state on subscribe + on change", () => {
      const transport = new FakeTransport();
      const manager = makeManager({ transport });
      expect(manager.state).toBe(AiConnectionState.Disconnected);

      const seen: AiConnectionState[] = [];
      manager.onStateChange((s) => seen.push(s));

      transport.setState(AiConnectionState.Connecting);
      transport.setState(AiConnectionState.Connected);
      transport.setState(AiConnectionState.Disconnected);

      expect(seen).toEqual([
        AiConnectionState.Connecting,
        AiConnectionState.Connected,
        AiConnectionState.Disconnected,
      ]);
    });

    it("overlays Offline when the detector reports offline", () => {
      const transport = new FakeTransport();
      const detector = new FakeDetector();
      const manager = makeManager({ transport, detector });
      transport.setState(AiConnectionState.Connected);
      expect(manager.state).toBe(AiConnectionState.Connected);

      detector.flip(false);
      expect(manager.state).toBe(AiConnectionState.Offline);
      expect(manager.reason?.message).toContain("offline");

      detector.flip(true);
      expect(manager.state).toBe(AiConnectionState.Connected);
    });

    it("populates a human-readable reason on non-Connected states (Req 24.6)", () => {
      const transport = new FakeTransport();
      const manager = makeManager({ transport });

      transport.setState(AiConnectionState.Error);
      expect(manager.reason).toEqual({
        state: AiConnectionState.Error,
        message: expect.stringContaining("error"),
      });
      expect(manager.isConnected).toBe(false);

      transport.setState(AiConnectionState.Connected);
      expect(manager.reason).toBeUndefined();
      expect(manager.isConnected).toBe(true);
    });

    it("does not fire listeners on no-op transitions", () => {
      const transport = new FakeTransport();
      const manager = makeManager({ transport });
      const listener = vi.fn();
      manager.onStateChange(listener);

      transport.setState(AiConnectionState.Connected);
      transport.setState(AiConnectionState.Connected); // same

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("unsubscribes cleanly", () => {
      const transport = new FakeTransport();
      const manager = makeManager({ transport });
      const listener = vi.fn();
      const off = manager.onStateChange(listener);
      off();
      transport.setState(AiConnectionState.Connected);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("event emission", () => {
    it("emits AI_EVENTS.CONNECTION_CHANGED on every state change", async () => {
      const transport = new FakeTransport();
      const emit = vi.fn(() => Promise.resolve());
      const events: IEventEmitter = {
        emit,
        on: () => () => undefined,
        eventNames: () => [],
        listenerCount: () => 0,
        removeAllListeners: () => undefined,
      };
      const manager = makeManager({ transport, events });
      transport.setState(AiConnectionState.Connecting);
      transport.setState(AiConnectionState.Connected);

      expect(emit).toHaveBeenCalledWith(
        AI_EVENTS.CONNECTION_CHANGED,
        expect.objectContaining({ state: AiConnectionState.Connecting }),
      );
      expect(emit).toHaveBeenCalledWith(
        AI_EVENTS.CONNECTION_CHANGED,
        expect.objectContaining({ state: AiConnectionState.Connected }),
      );
      expect(manager).toBeDefined();
    });
  });

  describe("scheduleReconnect (Req 24.3)", () => {
    it("produces a bounded exponential backoff sequence with monotonic delays", () => {
      const manager = makeManager();
      const delays: number[] = [];
      let step = manager.scheduleReconnect();
      while (step !== null) {
        delays.push(step.delayMs);
        step = manager.scheduleReconnect();
      }
      // baseMs=100, capMs=1_000, maxAttempts=4 → [100, 200, 400, 800]
      expect(delays).toEqual([100, 200, 400, 800]);
    });

    it("returns null once maxAttempts is exhausted", () => {
      const manager = makeManager();
      for (let i = 0; i < baseConfig.retryPolicy!.maxAttempts; i++) {
        expect(manager.scheduleReconnect()).not.toBeNull();
      }
      expect(manager.scheduleReconnect()).toBeNull();
    });

    it("resets attempt counter on resetBackoff", () => {
      const manager = makeManager();
      manager.scheduleReconnect();
      manager.scheduleReconnect();
      expect(manager.attemptCount).toBe(2);

      manager.resetBackoff();
      expect(manager.attemptCount).toBe(0);
      expect(manager.scheduleReconnect()?.attempt).toBe(0);
    });

    it("falls back to defaults when config omits retryPolicy", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { retryPolicy: _, ...rest } = baseConfig;
      const manager = makeManager({ config: rest as IAiConfig });
      // Fallback maxAttempts is 5.
      let steps = 0;
      while (manager.scheduleReconnect() !== null) steps++;
      expect(steps).toBe(5);
    });
  });

  describe("resume context (Req 24.4)", () => {
    it("preserves runId and messageIds across getResumeContext", () => {
      const manager = makeManager();
      manager.noteRunActive("run-42", ["m1", "m2"]);
      const context = manager.getResumeContext();
      expect(context).toEqual({ runId: "run-42", messageIds: ["m1", "m2"] });
    });

    it("returns cloned message ids so external mutation does not leak", () => {
      const manager = makeManager();
      manager.noteRunActive("run", ["m1"]);
      const a = manager.getResumeContext();
      a!.messageIds.push("leaked");
      const b = manager.getResumeContext();
      expect(b?.messageIds).toEqual(["m1"]);
    });

    it("clears context + resets backoff on noteRunFinished", () => {
      const manager = makeManager();
      manager.noteRunActive("run", ["m1"]);
      manager.scheduleReconnect();
      manager.noteRunFinished();
      expect(manager.getResumeContext()).toBeNull();
      expect(manager.attemptCount).toBe(0);
    });
  });

  describe("lifecycle", () => {
    it("unsubscribes from transport on onModuleDestroy", () => {
      const transport = new FakeTransport();
      const manager = makeManager({ transport });
      const listener = vi.fn();
      manager.onStateChange(listener);

      manager.onModuleDestroy();
      transport.setState(AiConnectionState.Connected);

      // Listener would fire if the manager was still subscribed.
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
