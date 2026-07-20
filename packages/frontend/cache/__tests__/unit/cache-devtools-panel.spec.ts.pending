/**
 * @file cache-devtools-panel.spec.ts
 * @module @stackra/cache/tests/unit
 * @description Unit tests for the `CacheDevtoolsPanel` — verifies the
 *   `@DevtoolsPanel(...)` decorator stamps the expected metadata, the
 *   panel implements `IDevtoolsPanel`, and the badge counter reflects
 *   the number of configured stores.
 */

import "reflect-metadata";

import { describe, expect, it } from "vitest";
import { DEVTOOLS_PANEL_METADATA_KEY } from "@stackra/contracts";

import type { ICacheModuleConfig } from "@/core/interfaces";
import { CacheDevtoolsPanel } from "@/react/devtools/cache.devtools-panel";

/** Build a fixture config with N stores. */
function makeConfig(storeCount: number): ICacheModuleConfig {
  const stores: ICacheModuleConfig["stores"] = {};
  for (let i = 0; i < storeCount; i++) {
    stores[`store-${i}`] = { driver: "memory" };
  }
  return {
    default: `store-0`,
    stores,
  };
}

describe("CacheDevtoolsPanel", () => {
  it("stamps @DevtoolsPanel metadata with the expected id/title/category", () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, CacheDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe("cache");
    expect(metadata?.title).toBe("Cache");
    expect(metadata?.category).toBe("data");
    expect(metadata?.order).toBe(10);
  });

  it("constructs and implements IDevtoolsPanel", () => {
    const panel = new CacheDevtoolsPanel(makeConfig(2));
    // Public shape mirrors the IDevtoolsPanel contract.
    expect(panel.id).toBe("cache");
    expect(panel.title).toBe("Cache");
    expect(panel.category).toBe("data");
    expect(panel.view.type).toBe("component");
  });

  it("badge() returns the number of configured stores", () => {
    expect(new CacheDevtoolsPanel(makeConfig(3)).badge()).toBe(3);
  });

  it("badge() returns null when no stores are configured", () => {
    expect(new CacheDevtoolsPanel(makeConfig(0)).badge()).toBeNull();
  });
});
