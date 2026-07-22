// @vitest-environment node
/**
 * @file devtools-panels-loader.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Unit tests for `DevtoolsPanelsLoader`.
 *
 *   The loader is the discovery half of the panels-registration
 *   contract — it queries `IDiscoveryService.getProvidersByMetadata`
 *   at `onApplicationBootstrap` and registers each panel it finds.
 */

import { describe, expect, it, vi } from "vitest";

import type {
  IDevtoolsPanel,
  IDevtoolsPanelsRegistry,
  IDiscoveryProvider,
  IDiscoveryService,
} from "@stackra/contracts";

import { DevtoolsPanelsLoader } from "@/core/services/devtools-panels-loader.service";
import { createMockDevtoolsPanel } from "@/testing/create-mock-devtools-panel.util";

/** Build a minimal `IDevtoolsPanelsRegistry` mock. */
function makeRegistry(): IDevtoolsPanelsRegistry & { readonly registered: IDevtoolsPanel[] } {
  const registered: IDevtoolsPanel[] = [];
  return {
    registered,
    register: (panel: IDevtoolsPanel) => {
      registered.push(panel);
    },
    unregister: (id: string) => {
      const i = registered.findIndex((p) => p.id === id);
      if (i >= 0) registered.splice(i, 1);
    },
    list: () => registered,
    find: (id) => registered.find((p) => p.id === id) ?? null,
    byCategory: () => new Map(),
    subscribe: () => () => undefined,
  };
}

/** Build a stub discovery service. */
function makeDiscovery(providers: IDiscoveryProvider[]): IDiscoveryService {
  return {
    getProviders: () => providers,
    getProvidersByMetadata: (_key) => providers,
  };
}

/** Build a provider wrapper around an instance. */
function wrap(instance: unknown, name = "X"): IDiscoveryProvider {
  return {
    name,
    metatype: instance ? ((instance as object).constructor as never) : undefined,
    instance,
    metadata: {},
  } as unknown as IDiscoveryProvider;
}

describe("DevtoolsPanelsLoader", () => {
  it("is a no-op when no discovery service is bound", () => {
    const registry = makeRegistry();
    const loader = new DevtoolsPanelsLoader(registry);
    loader.onApplicationBootstrap();
    expect(registry.registered).toHaveLength(0);
  });

  it("registers every discovered panel", () => {
    const registry = makeRegistry();
    const p1 = createMockDevtoolsPanel({ id: "a" });
    const p2 = createMockDevtoolsPanel({ id: "b" });
    const discovery = makeDiscovery([wrap(p1), wrap(p2)]);
    const loader = new DevtoolsPanelsLoader(registry, discovery);
    loader.onApplicationBootstrap();
    expect(registry.registered.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("handles the zero-panels case", () => {
    const registry = makeRegistry();
    const discovery = makeDiscovery([]);
    const loader = new DevtoolsPanelsLoader(registry, discovery);
    loader.onApplicationBootstrap();
    expect(registry.registered).toHaveLength(0);
  });

  it("skips discovered instances that do not implement IDevtoolsPanel", () => {
    const registry = makeRegistry();
    // Mid-refactor stub — decorator stamped, but the instance
    // doesn't carry the required fields yet. Loader must skip
    // silently.
    const discovery = makeDiscovery([wrap({ id: 42, notAPanel: true })]);
    const loader = new DevtoolsPanelsLoader(registry, discovery);
    loader.onApplicationBootstrap();
    expect(registry.registered).toHaveLength(0);
  });

  it("uses getProvidersByMetadata (not getProviders)", () => {
    const registry = makeRegistry();
    const providers = [wrap(createMockDevtoolsPanel({ id: "x" }))];
    const discovery = makeDiscovery(providers);
    const spy = vi.spyOn(discovery, "getProvidersByMetadata");
    const loader = new DevtoolsPanelsLoader(registry, discovery);
    loader.onApplicationBootstrap();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("forwards every discovered instance to the registry (dedup is registry-side)", () => {
    // The loader does NOT dedup — that responsibility belongs to
    // the registry (last-wins per id). We assert both providers
    // reach the register call so the registry gets a chance to
    // apply its last-wins rule.
    const registry = makeRegistry();
    const first = createMockDevtoolsPanel({ id: "dup", title: "First" });
    const second = createMockDevtoolsPanel({ id: "dup", title: "Second" });
    const discovery = makeDiscovery([wrap(first), wrap(second)]);
    const loader = new DevtoolsPanelsLoader(registry, discovery);
    loader.onApplicationBootstrap();
    expect(registry.registered).toHaveLength(2);
  });
});
