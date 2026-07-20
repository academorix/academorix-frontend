/**
 * @file analytics-module.test.ts
 * @module @stackra/analytics/__tests__/unit
 * @description Structural tests for `AnalyticsModule.forRoot()`,
 *   `forRootAsync()`, and `forFeature()` — verifies the provider list
 *   contains the expected tokens/classes and that `forFeature` uses
 *   the shared `seedLoaderToken` + `createSeedLoader` pattern instead
 *   of returning a sentinel from a factory.
 */

import "reflect-metadata";
import { describe, it, expect } from "vitest";
import type { IAnalyticsProvider } from "@stackra/contracts";
import { ANALYTICS_CONFIG, ANALYTICS_MANAGER } from "@stackra/contracts";

import { AnalyticsModule } from "@/core/analytics.module";
import { AnalyticsManager } from "@/core/services/analytics-manager.service";
import { AnalyticsProviderLoader } from "@/core/services/analytics-provider-loader.service";

class CustomProvider implements IAnalyticsProvider {
  public readonly name = "custom";
  public track(): void {
    /* noop */
  }
}

describe("AnalyticsModule.forRoot", () => {
  it("binds config, manager, and loader as global", () => {
    const dyn = AnalyticsModule.forRoot();

    expect(dyn.module).toBe(AnalyticsModule);
    expect(dyn.global).toBe(true);

    // Verify config binding is a useValue with the merged shape.
    const configProvider = dyn.providers!.find((p: any) => p.provide === ANALYTICS_CONFIG) as {
      useValue: unknown;
    };
    expect(configProvider).toBeDefined();
    expect(configProvider.useValue).toMatchObject({ default: "console" });

    // Class provider for the manager.
    expect(dyn.providers).toContain(AnalyticsManager);
    // useExisting alias for the interface token.
    const aliasProvider = dyn.providers!.find((p: any) => p.provide === ANALYTICS_MANAGER) as {
      useExisting: unknown;
    };
    expect(aliasProvider).toBeDefined();
    expect(aliasProvider.useExisting).toBe(AnalyticsManager);

    // Discovery loader is present.
    expect(dyn.providers).toContain(AnalyticsProviderLoader);
  });

  it("exports the config token, manager token, and manager class", () => {
    const dyn = AnalyticsModule.forRoot();
    expect(dyn.exports).toContain(ANALYTICS_CONFIG);
    expect(dyn.exports).toContain(ANALYTICS_MANAGER);
    expect(dyn.exports).toContain(AnalyticsManager);
  });

  it("respects user options in the merged config", () => {
    const dyn = AnalyticsModule.forRoot({
      default: "my-provider",
      providers: {
        "my-provider": { driver: "console" },
      },
      bufferLimit: 5,
    });
    const cfg = dyn.providers!.find((p: any) => p.provide === ANALYTICS_CONFIG) as {
      useValue: any;
    };
    expect(cfg.useValue.default).toBe("my-provider");
    expect(cfg.useValue.bufferLimit).toBe(5);
    expect(cfg.useValue.providers).toHaveProperty("my-provider");
  });
});

describe("AnalyticsModule.forRootAsync", () => {
  it("wires an async factory for ANALYTICS_CONFIG", async () => {
    const dyn = AnalyticsModule.forRootAsync({
      useFactory: async () => ({ bufferLimit: 25 }),
    });

    const cfg = dyn.providers!.find((p: any) => p.provide === ANALYTICS_CONFIG) as {
      useFactory: (...args: unknown[]) => Promise<unknown>;
    };
    const merged = (await cfg.useFactory()) as { bufferLimit: number };
    expect(merged.bufferLimit).toBe(25);
    expect(dyn.global).toBe(true);
  });
});

describe("AnalyticsModule.forFeature", () => {
  it("registers a single provider class with a seed loader", () => {
    const dyn = AnalyticsModule.forFeature(CustomProvider);

    // The class itself is wired as a provider.
    expect(dyn.providers).toContain(CustomProvider);
    expect(dyn.exports).toEqual([CustomProvider]);

    // A seed-loader factory is present, keyed by a unique symbol.
    const factoryProvider = dyn.providers!.find(
      (p: any) => typeof p.provide === "symbol" && p.useFactory,
    ) as { useFactory: Function; inject: unknown[] };
    expect(factoryProvider).toBeDefined();

    // The factory returns an object with `onApplicationBootstrap` — no
    // sentinel-returning side-effect anti-pattern.
    const manager = { register: () => {} } as any;
    const provider = new CustomProvider();
    const loader = factoryProvider.useFactory(manager, provider);
    expect(loader).toHaveProperty("onApplicationBootstrap");
    expect(typeof (loader as any).onApplicationBootstrap).toBe("function");
  });

  it("accepts an array of provider classes", () => {
    class SecondCustom implements IAnalyticsProvider {
      public readonly name = "second";
      public track(): void {}
    }
    const dyn = AnalyticsModule.forFeature([CustomProvider, SecondCustom]);

    expect(dyn.exports).toEqual([CustomProvider, SecondCustom]);
    // Two seed-loader providers, one per class.
    const symbolProviders = dyn.providers!.filter((p: any) => typeof p.provide === "symbol");
    expect(symbolProviders).toHaveLength(2);
  });

  it("seeding via the loader calls manager.register()", () => {
    const dyn = AnalyticsModule.forFeature(CustomProvider);
    const factoryProvider = dyn.providers!.find(
      (p: any) => typeof p.provide === "symbol" && p.useFactory,
    ) as { useFactory: Function };

    const registered: IAnalyticsProvider[] = [];
    const manager = {
      register(p: IAnalyticsProvider) {
        registered.push(p);
      },
    } as any;
    const instance = new CustomProvider();
    const loader = factoryProvider.useFactory(manager, instance);

    (loader as any).onApplicationBootstrap();
    expect(registered).toEqual([instance]);
  });
});
