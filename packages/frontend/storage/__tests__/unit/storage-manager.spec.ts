/**
 * @file storage-manager.spec.ts
 * @module @stackra/storage/test/unit
 * @description `StorageManager` resolves named instances from config,
 *   dispatches to the right `create{Driver}Driver` method or
 *   custom-creator, caches subsequent resolutions, and throws with a
 *   helpful message on unknown drivers.
 */

import { describe, it, expect } from "vitest";

import type { IStorage, IStorageConfig } from "@stackra/contracts";

import { StorageDriverError } from "@/core/errors/storage-driver.error";
import { MemoryStore } from "@/core/stores/memory.store";
import { NullStore } from "@/core/stores/null.store";
import { StorageManager } from "@/core/services/storage-manager.service";

/** Build a manager with a two-store config for tests. */
function buildManager(overrides: Partial<IStorageConfig> = {}): StorageManager {
  const cfg: IStorageConfig = {
    default: overrides.default ?? "main",
    stores: overrides.stores ?? {
      main: { driver: "memory" },
      sink: { driver: "null" },
    },
  };
  return new StorageManager(cfg);
}

describe("StorageManager", () => {
  it("instance() resolves to a MemoryStore when driver is memory", () => {
    const manager = buildManager();
    const store = manager.instance("main");
    expect(store).toBeInstanceOf(MemoryStore);
  });

  it("instance() resolves to a NullStore when driver is null", () => {
    const manager = buildManager();
    const store = manager.instance("sink");
    expect(store).toBeInstanceOf(NullStore);
  });

  it("instance() defaults to the config.default when no name is passed", () => {
    const manager = buildManager({ default: "sink" });
    expect(manager.instance()).toBeInstanceOf(NullStore);
  });

  it("caches the resolved instance across repeat calls", () => {
    const manager = buildManager();
    const a = manager.instance("main");
    const b = manager.instance("main");
    expect(a).toBe(b);
  });

  it("extend() registers a custom driver + wins on next resolve", () => {
    const manager = buildManager({
      default: "custom",
      stores: { custom: { driver: "inline" } },
    });

    class InlineStore extends NullStore {}
    manager.extend("inline", () => new InlineStore());

    const store = manager.instance();
    expect(store).toBeInstanceOf(InlineStore);
  });

  it("resolves an unknown-driver instance by throwing (via base) — StorageDriverError produced from setDefault", () => {
    const manager = buildManager();
    // The MultipleInstanceManager base throws a generic Error when a
    // config's driver isn't registered — assert that we surface the
    // driver name in the message.
    expect(() => manager.setDefaultInstance("missing-store")).toThrow(StorageDriverError);
  });

  it("resolving an unknown driver from config throws a helpful error", () => {
    const manager = buildManager({
      default: "bad",
      stores: { bad: { driver: "unregistered-driver" } },
    });
    // The MultipleInstanceManager base throws a plain Error naming
    // the driver — verify the message so downstream diagnostics stay
    // stable.
    let caught: unknown = null;
    try {
      manager.instance("bad");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(String((caught as Error).message)).toContain("unregistered-driver");
  });

  it("accepts custom drivers producing typed stores", () => {
    const manager = buildManager({
      default: "custom",
      stores: { custom: { driver: "echo", greeting: "hi" } },
    });

    manager.extend("echo", (config): IStorage => {
      // Custom creators receive the raw config including the
      // manager-supplied __instanceName field.
      expect(config["greeting"]).toBe("hi");
      expect(config["__instanceName"]).toBe("custom");
      return new MemoryStore();
    });

    expect(manager.instance()).toBeInstanceOf(MemoryStore);
  });
});
