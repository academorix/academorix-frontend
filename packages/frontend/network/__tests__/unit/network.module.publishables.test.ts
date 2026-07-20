/**
 * @file network.module.publishables.test.ts
 * @module @stackra/network/tests
 * @description Verifies the module-level `configurePublishables()`
 *   manifest and `PACKAGE_ROOT` contract on `NetworkModule`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { NetworkModule } from "@/core/network.module";

import type { IPublishableConsumer, IPublishableEntry } from "@stackra/contracts";

interface ISpyConsumer extends IPublishableConsumer {
  readonly entries: IPublishableEntry[];
}

function makeSpyConsumer(): ISpyConsumer {
  const entries: IPublishableEntry[] = [];
  const consumer: ISpyConsumer = {
    entries,
    publish: vi.fn((entry: IPublishableEntry) => {
      entries.push(entry);
      return consumer;
    }),
  };
  return consumer;
}

describe("NetworkModule.PACKAGE_ROOT + configurePublishables", () => {
  describe("PACKAGE_ROOT", () => {
    it("is a non-empty absolute path", () => {
      expect(typeof NetworkModule.PACKAGE_ROOT).toBe("string");
      expect(NetworkModule.PACKAGE_ROOT.length).toBeGreaterThan(0);
      expect(path.isAbsolute(NetworkModule.PACKAGE_ROOT)).toBe(true);
    });

    it("resolves to an existing directory on disk", () => {
      expect(existsSync(NetworkModule.PACKAGE_ROOT)).toBe(true);
    });
  });

  describe("configurePublishables", () => {
    it("registers exactly one tag: `network-config`", () => {
      const consumer = makeSpyConsumer();
      NetworkModule.configurePublishables(consumer);

      expect(consumer.entries.length).toBe(1);
      expect(consumer.entries[0]?.tag).toBe("network-config");
    });

    it("ships the reference `config/network.config.ts` file", () => {
      const consumer = makeSpyConsumer();
      NetworkModule.configurePublishables(consumer);
      const files = consumer.entries[0]?.files ?? [];
      const paths = files.map((f) => (typeof f === "string" ? f : f.from));
      expect(paths).toContain("config/network.config.ts");
    });

    it("does NOT declare packageRoot on the entry (relies on the class static)", () => {
      const consumer = makeSpyConsumer();
      NetworkModule.configurePublishables(consumer);
      expect(consumer.entries[0]?.packageRoot).toBeUndefined();
    });
  });
});
