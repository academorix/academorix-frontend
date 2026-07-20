/**
 * @file config.module.publishables.test.ts
 * @module @stackra/config/tests
 * @description Verifies the module-level `configurePublishables()`
 *   manifest and `PACKAGE_ROOT` contract on `ConfigModule`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { ConfigModule } from "@/core/config.module";

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

describe("ConfigModule.PACKAGE_ROOT + configurePublishables", () => {
  describe("PACKAGE_ROOT", () => {
    it("is a non-empty absolute path", () => {
      expect(typeof ConfigModule.PACKAGE_ROOT).toBe("string");
      expect(ConfigModule.PACKAGE_ROOT.length).toBeGreaterThan(0);
      expect(path.isAbsolute(ConfigModule.PACKAGE_ROOT)).toBe(true);
    });

    it("resolves to an existing directory on disk", () => {
      expect(existsSync(ConfigModule.PACKAGE_ROOT)).toBe(true);
    });
  });

  describe("configurePublishables", () => {
    it("registers exactly one tag: `stackra-config`", () => {
      const consumer = makeSpyConsumer();
      ConfigModule.configurePublishables(consumer);

      expect(consumer.entries.length).toBe(1);
      expect(consumer.entries[0]?.tag).toBe("stackra-config");
    });

    it("ships a description and at least one file", () => {
      const consumer = makeSpyConsumer();
      ConfigModule.configurePublishables(consumer);
      const [entry] = consumer.entries;
      expect((entry?.description ?? "").length).toBeGreaterThan(0);
      expect((entry?.files ?? []).length).toBeGreaterThan(0);
    });

    it("does NOT declare packageRoot on the entry (relies on the class static)", () => {
      const consumer = makeSpyConsumer();
      ConfigModule.configurePublishables(consumer);
      expect(consumer.entries[0]?.packageRoot).toBeUndefined();
    });
  });
});
