/**
 * @file container-devtools-panel.spec.ts
 * @module @stackra/container/__tests__/unit
 * @description Behavioural spec for the `ContainerDevtoolsPanel` —
 *   metadata stamp, badge behaviour, and the empty-state path when
 *   `IDiscoveryService` is absent.
 */

import "reflect-metadata";

import { describe, expect, it } from "vitest";
import {
  DEVTOOLS_PANEL_METADATA_KEY,
  type IDiscoveryProvider,
  type IDiscoveryService,
} from "@stackra/contracts";

import { ContainerDevtoolsPanel } from "@/react/devtools/container.devtools-panel";

/** Build a stub discovery service that returns a fixed provider list. */
function makeDiscovery(providers: IDiscoveryProvider[]): IDiscoveryService {
  return {
    getProviders: () => providers,
    getProvidersByMetadata: () => providers,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("ContainerDevtoolsPanel", () => {
  it('stamps @DevtoolsPanel metadata with id "container", framework category, order 40', () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, ContainerDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata?.id).toBe("container");
    expect(metadata?.title).toBe("Container");
    expect(metadata?.category).toBe("framework");
    expect(metadata?.order).toBe(40);
  });

  it("constructs with an absent discovery service and exposes IDevtoolsPanel fields", () => {
    const panel = new ContainerDevtoolsPanel();
    expect(panel.id).toBe("container");
    expect(panel.title).toBe("Container");
    expect(panel.category).toBe("framework");
    expect(panel.order).toBe(40);
    expect(panel.view.type).toBe("component");
  });

  it("badge() returns null when the discovery service is absent", () => {
    // Missing discovery service is a valid state (headless embed).
    expect(new ContainerDevtoolsPanel().badge()).toBeNull();
  });

  it("badge() returns null when the discovery service reports zero providers", () => {
    const discovery = makeDiscovery([]);
    expect(new ContainerDevtoolsPanel(discovery).badge()).toBeNull();
  });

  it("badge() returns the provider count when the discovery service reports providers", () => {
    const providers: IDiscoveryProvider[] = [
      { instance: {}, metatype: null, name: "A" },
      { instance: {}, metatype: null, name: "B" },
      { instance: {}, metatype: null, name: "C" },
    ];
    const discovery = makeDiscovery(providers);
    expect(new ContainerDevtoolsPanel(discovery).badge()).toBe(3);
  });

  it("badge() returns null when the discovery service throws", () => {
    // fail-soft — a broken adapter must not blow up the badge.
    const throwingDiscovery = {
      getProviders: () => {
        throw new Error("boom");
      },
      getProvidersByMetadata: () => [],
    } as IDiscoveryService;
    expect(new ContainerDevtoolsPanel(throwingDiscovery).badge()).toBeNull();
  });
});
