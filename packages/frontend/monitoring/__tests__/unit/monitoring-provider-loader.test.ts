/**
 * @file monitoring-provider-loader.test.ts
 * @module @stackra/monitoring/__tests__/unit
 * @description Behavioural tests for `MonitoringProviderLoader` —
 *   the `onApplicationBootstrap` loader that registers every
 *   `@MonitoringProvider()`-decorated instance with the manager.
 */

import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import type { ICaptureContext, IMonitoringManager, IMonitoringProvider } from "@stackra/contracts";

import { MonitoringProvider } from "@/core/decorators/monitoring-provider.decorator";
import { MonitoringProviderLoader } from "@/core/services/monitoring-provider-loader.service";

import { MockDiscoveryService } from "../support/mock-discovery";

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

/** Build a stub manager that records `.register()` calls. */
function makeStubManager(): IMonitoringManager & { registered: IMonitoringProvider[] } {
  const registered: IMonitoringProvider[] = [];
  return {
    registered,
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
    setUser: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    getProviders: () => registered,
    register(provider: IMonitoringProvider) {
      registered.push(provider);
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Test reporters
// ════════════════════════════════════════════════════════════════════════════

@MonitoringProvider({ name: "good-reporter" })
class GoodReporter implements IMonitoringProvider {
  public readonly name = "good-reporter";
  public captured: Array<{ error: Error; context?: ICaptureContext }> = [];
  public captureException(error: Error, context?: ICaptureContext): void {
    this.captured.push({ error, context });
  }
}

@MonitoringProvider({ name: "another-reporter" })
class AnotherReporter implements IMonitoringProvider {
  public readonly name = "another-reporter";
  public captureException(): void {}
}

/** Decorated but no `captureException` — must be rejected. */
@MonitoringProvider({ name: "malformed" })
class MalformedReporter {
  public readonly name = "malformed";
}

/** Not decorated — mock discovery filters it out at the metadata layer. */
class UndecoratedReporter implements IMonitoringProvider {
  public readonly name = "undecorated";
  public captureException(): void {}
}

// ════════════════════════════════════════════════════════════════════════════
// Specs
// ════════════════════════════════════════════════════════════════════════════

describe("MonitoringProviderLoader", () => {
  it("registers every @MonitoringProvider() instance on bootstrap", () => {
    const manager = makeStubManager();
    const discovery = new MockDiscoveryService([
      { instance: new GoodReporter() },
      { instance: new AnotherReporter() },
    ]);
    const loader = new MonitoringProviderLoader(manager, discovery);

    loader.onApplicationBootstrap();

    const names = manager.registered.map((p) => p.name).sort();
    expect(names).toEqual(["another-reporter", "good-reporter"]);
  });

  it("is a no-op without a discovery service", () => {
    const manager = makeStubManager();
    const loader = new MonitoringProviderLoader(manager);

    expect(() => loader.onApplicationBootstrap()).not.toThrow();
    expect(manager.registered).toHaveLength(0);
  });

  it("skips instances that lack captureException", () => {
    const manager = makeStubManager();
    const discovery = new MockDiscoveryService([
      { instance: new MalformedReporter() },
      { instance: new GoodReporter() },
    ]);
    const loader = new MonitoringProviderLoader(manager, discovery);

    loader.onApplicationBootstrap();

    // Malformed dropped, good survives.
    expect(manager.registered.map((p) => p.name)).toEqual(["good-reporter"]);
  });

  it("ignores classes returned by discovery that are not decorated", () => {
    const manager = makeStubManager();
    // MockDiscoveryService already filters by the actual metadata key —
    // an undecorated class is invisible.
    const discovery = new MockDiscoveryService([{ instance: new UndecoratedReporter() }]);
    const loader = new MonitoringProviderLoader(manager, discovery);

    loader.onApplicationBootstrap();
    expect(manager.registered).toHaveLength(0);
  });
});
