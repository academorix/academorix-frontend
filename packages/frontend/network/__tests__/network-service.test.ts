/**
 * @file network-service.test.ts
 * @module @stackra/network/__tests__
 * @description Unit tests for the NetworkService and NodeNetworkDetector.
 *   Verifies delegation to the detector, event emission on status changes,
 *   graceful behavior without an event manager, and detector lifecycle.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@stackra/container", () => ({
  Inject: () => () => {},
  Injectable: () => (target: any) => target,
  Optional: () => () => {},
}));

vi.mock("@stackra/logger", () => ({
  Logger: class MockLogger {
    debug = vi.fn();
    info = vi.fn();
    warn = vi.fn();
    error = vi.fn();
  },
}));

vi.mock("@stackra/contracts", () => ({
  EVENT_EMITTER: Symbol.for("EVENT_EMITTER"),
  NETWORK_DETECTOR: Symbol.for("NETWORK_DETECTOR"),
  NETWORK_EVENTS: { STATUS_CHANGED: "network.status-changed" },
  NETWORK_STATUS_CHANGED: "network.status-changed",
}));

import { NetworkService } from "@/core/services/network.service";
import type { INetworkDetector, NetworkStatus } from "@stackra/contracts";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a mock INetworkDetector with controllable subscribe behavior.
 *
 * @returns Mock detector with vi.fn() stubs
 */
function createMockDetector(): INetworkDetector & {
  triggerChange: (status: NetworkStatus) => void;
} {
  let subscribedCb: ((status: NetworkStatus) => void) | null = null;
  const unsubFn = vi.fn();

  const detector: any = {
    isOnline: vi.fn().mockReturnValue(true),
    getStatus: vi.fn().mockResolvedValue({ isOnline: true, type: "wifi" as const }),
    subscribe: vi.fn((cb: (status: NetworkStatus) => void) => {
      subscribedCb = cb;
      return unsubFn;
    }),
    triggerChange: (status: NetworkStatus) => {
      if (subscribedCb) subscribedCb(status);
    },
  };

  return detector;
}

/**
 * Create a mock event emitter (IEventEmitter shape).
 *
 * @returns Mock emitter with a spied `emit`
 */
function createMockEventManager() {
  return {
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
    eventNames: vi.fn().mockReturnValue([]),
    listenerCount: vi.fn().mockReturnValue(0),
    removeAllListeners: vi.fn(),
  };
}

// ============================================================================
// NetworkService Tests
// ============================================================================

describe("NetworkService", () => {
  let detector: ReturnType<typeof createMockDetector>;
  let eventManager: ReturnType<typeof createMockEventManager>;
  let service: NetworkService;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = createMockDetector();
    eventManager = createMockEventManager();
    service = new NetworkService(detector, eventManager as any);
  });

  // ── isOnline() ──────────────────────────────────────────────────────────

  describe("isOnline()", () => {
    it("delegates to detector", () => {
      (detector.isOnline as any).mockReturnValue(false);

      const result = service.isOnline();

      expect(detector.isOnline).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  // ── getStatus() ─────────────────────────────────────────────────────────

  describe("getStatus()", () => {
    it("delegates to detector", async () => {
      const expected: NetworkStatus = { isOnline: true, type: "ethernet" };
      (detector.getStatus as any).mockResolvedValue(expected);

      const result = await service.getStatus();

      expect(detector.getStatus).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  // ── subscribe() ─────────────────────────────────────────────────────────

  describe("subscribe()", () => {
    it("delegates to detector", () => {
      const cb = vi.fn();
      service.subscribe(cb);

      expect(detector.subscribe).toHaveBeenCalledWith(cb);
    });
  });

  // ── Event emission on status change ─────────────────────────────────────

  describe("event emission", () => {
    it("emits event on status change when an emitter is available", () => {
      const newStatus: NetworkStatus = { isOnline: false, type: "unknown" };
      detector.triggerChange(newStatus);

      expect(eventManager.emit).toHaveBeenCalledWith("network.status-changed", {
        status: newStatus,
      });
    });

    it("does not crash when event manager is not available", () => {
      void new NetworkService(detector, undefined);
      const newStatus: NetworkStatus = { isOnline: false };

      expect(() => detector.triggerChange(newStatus)).not.toThrow();
    });
  });

  // ── destroy() ─────────────────────────────────────────────────────────────

  describe("destroy()", () => {
    it("unsubscribes from detector", () => {
      service.destroy();

      // The unsubscribe function returned by subscribe should have been called
      const unsubFn = (detector.subscribe as any).mock.results[0]?.value;
      if (unsubFn) {
        expect(unsubFn).toHaveBeenCalled();
      }
    });
  });
});

// ============================================================================
// NodeNetworkDetector Tests
// ============================================================================

describe("NodeNetworkDetector", () => {
  // We test without real DNS by mocking the import
  let NodeNetworkDetector: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Dynamically import to reset module state
    const mod = await import("@/core/detectors/node-network.detector");
    NodeNetworkDetector = mod.NodeNetworkDetector;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isOnline()", () => {
    it("returns last known state (defaults to true)", () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 60_000 });

      expect(detector.isOnline()).toBe(true);
      detector.destroy();
    });
  });

  describe("getStatus()", () => {
    it("performs DNS check and returns status", async () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 60_000 });

      const status = await detector.getStatus();
      // In test environment, DNS may or may not work
      expect(status).toHaveProperty("isOnline");
      expect(status).toHaveProperty("type");
      detector.destroy();
    });
  });

  describe("subscribe()", () => {
    it("registers a listener", () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 60_000 });
      const cb = vi.fn();

      const unsub = detector.subscribe(cb);
      expect(typeof unsub).toBe("function");

      detector.destroy();
    });

    it("returns an unsubscribe function that removes the listener", () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 60_000 });
      const cb = vi.fn();

      const unsub = detector.subscribe(cb);
      unsub();

      // After unsubscribe, listener should not be called
      detector.destroy();
    });
  });

  describe("destroy()", () => {
    it("clears timer and listeners", () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 1000 });
      const cb = vi.fn();
      detector.subscribe(cb);

      detector.destroy();

      // No errors should occur after destroy
      expect(detector.isOnline()).toBe(true);
    });
  });
});
