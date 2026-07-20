/**
 * @file analytics-provider-loader.test.ts
 * @module @stackra/analytics/__tests__/unit
 * @description Behavioural tests for `AnalyticsProviderLoader` — the
 *   `onApplicationBootstrap` discovery loader that registers every
 *   `@AnalyticsProvider()`-decorated instance with the manager.
 */

import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import type { IAnalyticsEvent, IAnalyticsManager, IAnalyticsProvider } from "@stackra/contracts";

import { AnalyticsProvider } from "@/core/decorators/analytics-provider.decorator";
import { AnalyticsProviderLoader } from "@/core/services/analytics-provider-loader.service";

import { MockDiscoveryService } from "../support/mock-discovery";

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

/** Build a stub manager that records `.register()` calls. */
function makeStubManager(): IAnalyticsManager & { registered: IAnalyticsProvider[] } {
  const registered: IAnalyticsProvider[] = [];
  return {
    registered,
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    getProviders: () => registered,
    register(provider: IAnalyticsProvider) {
      registered.push(provider);
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Test providers — decorated with the real @AnalyticsProvider() decorator.
// ════════════════════════════════════════════════════════════════════════════

@AnalyticsProvider({ name: "good-provider" })
class GoodProvider implements IAnalyticsProvider {
  public readonly name = "good-provider";
  public tracked: IAnalyticsEvent[] = [];
  public track(event: IAnalyticsEvent): void {
    this.tracked.push(event);
  }
}

@AnalyticsProvider({ name: "another-provider" })
class AnotherProvider implements IAnalyticsProvider {
  public readonly name = "another-provider";
  public track(): void {
    /* noop */
  }
}

/** Undecorated class — must be ignored by the loader. */
class UndecoratedProvider implements IAnalyticsProvider {
  public readonly name = "undecorated";
  public track(): void {
    /* noop */
  }
}

/** Decorated but shaped wrong — no `.track()` — must be ignored. */
@AnalyticsProvider({ name: "malformed" })
class MalformedProvider {
  public readonly name = "malformed";
  // No `track` method — loader rejects it.
}

// ════════════════════════════════════════════════════════════════════════════
// Specs
// ════════════════════════════════════════════════════════════════════════════

describe("AnalyticsProviderLoader", () => {
  it("registers every @AnalyticsProvider()-decorated instance on bootstrap", () => {
    const manager = makeStubManager();
    const discovery = new MockDiscoveryService([
      { instance: new GoodProvider() },
      { instance: new AnotherProvider() },
    ]);
    const loader = new AnalyticsProviderLoader(manager, discovery);

    loader.onApplicationBootstrap();

    const names = manager.registered.map((p) => p.name).sort();
    expect(names).toEqual(["another-provider", "good-provider"]);
  });

  it("is a no-op when the discovery service is not available", () => {
    const manager = makeStubManager();
    // Simulates the `@Optional() @Inject(DISCOVERY_SERVICE)` path in a
    // container that has not bound the discovery service.
    const loader = new AnalyticsProviderLoader(manager);

    expect(() => loader.onApplicationBootstrap()).not.toThrow();
    expect(manager.registered).toHaveLength(0);
  });

  it("skips instances that lack a `.track` method", () => {
    const manager = makeStubManager();
    const discovery = new MockDiscoveryService([
      { instance: new MalformedProvider() },
      { instance: new GoodProvider() },
    ]);
    const loader = new AnalyticsProviderLoader(manager, discovery);

    loader.onApplicationBootstrap();

    // Malformed dropped, good survives.
    expect(manager.registered.map((p) => p.name)).toEqual(["good-provider"]);
  });

  it("ignores undecorated providers even when returned by discovery", () => {
    const manager = makeStubManager();
    // The mock returns only what matches the metadata key — an undecorated
    // class is filtered out at the discovery layer.
    const discovery = new MockDiscoveryService([{ instance: new UndecoratedProvider() }]);
    const loader = new AnalyticsProviderLoader(manager, discovery);

    loader.onApplicationBootstrap();

    expect(manager.registered).toHaveLength(0);
  });
});
