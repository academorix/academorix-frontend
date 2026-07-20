/**
 * @file noop-tab-transport.spec.ts
 * @module @stackra/coordinator/__tests__/unit
 * @description Behavioural spec for `NoopTabTransport` — the
 *   fallback transport handed out by `TabTransportManager` when
 *   `BroadcastChannel` is unavailable (SSR, hardened iframes,
 *   older browsers).
 */

import { describe, it, expect, vi } from "vitest";

import { NoopTabTransport } from "@/core/transports/noop-tab.transport";

describe("NoopTabTransport", () => {
  it("exposes the channel name it was constructed with", () => {
    const transport = new NoopTabTransport("stackra-events");
    expect(transport.channelName).toBe("stackra-events");
  });

  describe("subscribe", () => {
    it("returns a no-op unsubscribe function", () => {
      const transport = new NoopTabTransport("any");
      const listener = vi.fn();
      const unsub = transport.subscribe(listener);
      expect(typeof unsub).toBe("function");
      expect(() => unsub()).not.toThrow();
    });

    it("never invokes the listener even after a broadcast", () => {
      const transport = new NoopTabTransport("any");
      const listener = vi.fn();
      transport.subscribe(listener);
      transport.broadcast({ v: 1 });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("broadcast", () => {
    it("is a silent no-op regardless of payload", () => {
      const transport = new NoopTabTransport("any");
      expect(() => transport.broadcast(undefined)).not.toThrow();
      expect(() => transport.broadcast({ deep: { nested: [1, 2, 3] } })).not.toThrow();
    });
  });

  describe("close", () => {
    it("is a silent no-op (idempotent)", () => {
      const transport = new NoopTabTransport("any");
      expect(() => transport.close()).not.toThrow();
      expect(() => transport.close()).not.toThrow();
    });
  });
});
