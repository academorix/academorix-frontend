/**
 * @file tab-transport-manager.spec.ts
 * @module @stackra/coordinator/__tests__/unit
 * @description Behavioural spec for `TabTransportManager` — the
 *   production `ITabTransportManager` that hands out cross-tab
 *   channels. Verifies environment detection, per-name caching,
 *   explicit release, and lifecycle teardown on module destroy.
 *
 *   Environment detection is exercised by toggling
 *   `globalThis.BroadcastChannel` between a minimal shim and
 *   `undefined`; no real `BroadcastChannel` is needed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { TabTransportManager } from "@/core/services/tab-transport-manager.service";
import { BroadcastChannelTabTransport } from "@/core/transports/broadcast-channel-tab.transport";
import { NoopTabTransport } from "@/core/transports/noop-tab.transport";

// ════════════════════════════════════════════════════════════════════════════════
// Minimal BroadcastChannel shim — never delivers messages; the manager
// only cares whether the constructor works and `close()` succeeds.
// ════════════════════════════════════════════════════════════════════════════════

class StubBroadcastChannel {
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public closed = false;
  public constructor(public readonly name: string) {}
  public postMessage(_data: unknown): void {
    /* no-op */
  }
  public close(): void {
    this.closed = true;
  }
}

const originalBroadcastChannel = (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;

function installBroadcastChannel(): void {
  (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel =
    StubBroadcastChannel as unknown as typeof BroadcastChannel;
}

function removeBroadcastChannel(): void {
  (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = undefined;
}

function restoreBroadcastChannel(): void {
  (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = originalBroadcastChannel;
}

describe("TabTransportManager", () => {
  beforeEach(() => {
    installBroadcastChannel();
  });

  afterEach(() => {
    restoreBroadcastChannel();
    vi.restoreAllMocks();
  });

  describe("isSupported", () => {
    it("returns true when BroadcastChannel is defined", () => {
      const manager = new TabTransportManager();
      expect(manager.isSupported()).toBe(true);
    });

    it("returns false when BroadcastChannel is undefined", () => {
      removeBroadcastChannel();
      const manager = new TabTransportManager();
      expect(manager.isSupported()).toBe(false);
    });
  });

  describe("channel", () => {
    it("hands out a BroadcastChannelTabTransport when supported", () => {
      const manager = new TabTransportManager();
      const transport = manager.channel("sync");
      expect(transport).toBeInstanceOf(BroadcastChannelTabTransport);
      expect(transport.channelName).toBe("sync");
    });

    it("hands out a NoopTabTransport when unsupported", () => {
      removeBroadcastChannel();
      const manager = new TabTransportManager();
      const transport = manager.channel("sync");
      expect(transport).toBeInstanceOf(NoopTabTransport);
      expect(transport.channelName).toBe("sync");
    });

    it("caches transports by channel name (second call returns the same instance)", () => {
      const manager = new TabTransportManager();
      const first = manager.channel("room:42");
      const second = manager.channel("room:42");
      expect(second).toBe(first);
    });

    it("returns distinct transports for distinct names", () => {
      const manager = new TabTransportManager();
      const a = manager.channel("a");
      const b = manager.channel("b");
      expect(a).not.toBe(b);
    });
  });

  describe("release", () => {
    it("closes and evicts a cached channel", () => {
      const manager = new TabTransportManager();
      const transport = manager.channel("sync") as BroadcastChannelTabTransport;
      const closeSpy = vi.spyOn(transport, "close");

      manager.release("sync");

      expect(closeSpy).toHaveBeenCalledTimes(1);
      // A subsequent channel() call rebuilds a fresh transport.
      const rebuilt = manager.channel("sync");
      expect(rebuilt).not.toBe(transport);
    });

    it("is a no-op for an unknown channel name", () => {
      const manager = new TabTransportManager();
      // Must not throw even when nothing was cached under the name.
      expect(() => manager.release("never-opened")).not.toThrow();
    });

    it("swallows errors thrown by the underlying transport close", () => {
      const manager = new TabTransportManager();
      const transport = manager.channel("sync") as BroadcastChannelTabTransport;
      vi.spyOn(transport, "close").mockImplementation(() => {
        throw new Error("bad channel");
      });

      // fail-soft — release should never throw even when the close does.
      expect(() => manager.release("sync")).not.toThrow();
      expect(manager.channel("sync")).not.toBe(transport);
    });
  });

  describe("onModuleDestroy", () => {
    it("closes every cached channel and clears the cache", () => {
      const manager = new TabTransportManager();
      const a = manager.channel("a") as BroadcastChannelTabTransport;
      const b = manager.channel("b") as BroadcastChannelTabTransport;
      const closeA = vi.spyOn(a, "close");
      const closeB = vi.spyOn(b, "close");

      manager.onModuleDestroy();

      expect(closeA).toHaveBeenCalledTimes(1);
      expect(closeB).toHaveBeenCalledTimes(1);
      // The cache is cleared — a fresh channel() call after destroy
      // returns a new transport, not one of the closed ones.
      const rebuilt = manager.channel("a");
      expect(rebuilt).not.toBe(a);
    });

    it("swallows errors thrown by an individual transport close", () => {
      const manager = new TabTransportManager();
      const a = manager.channel("a") as BroadcastChannelTabTransport;
      const b = manager.channel("b") as BroadcastChannelTabTransport;
      vi.spyOn(a, "close").mockImplementation(() => {
        throw new Error("bad channel");
      });
      const closeB = vi.spyOn(b, "close");

      expect(() => manager.onModuleDestroy()).not.toThrow();
      // Teardown continues past the failing close and reaches `b`.
      expect(closeB).toHaveBeenCalledTimes(1);
    });
  });
});
