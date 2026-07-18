/**
 * @file routing.module.publishables.test.ts
 * @module @stackra/routing/tests
 * @description Verifies the module-level `configurePublishables()`
 *   manifest and `PACKAGE_ROOT` contract on `RoutingModule`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { RoutingModule } from "@/core/routing.module";

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

describe("RoutingModule.PACKAGE_ROOT + configurePublishables", () => {
  describe("PACKAGE_ROOT", () => {
    it("is a non-empty absolute path", () => {
      expect(typeof RoutingModule.PACKAGE_ROOT).toBe("string");
      expect(RoutingModule.PACKAGE_ROOT.length).toBeGreaterThan(0);
      expect(path.isAbsolute(RoutingModule.PACKAGE_ROOT)).toBe(true);
    });

    it("resolves to an existing directory on disk", () => {
      expect(existsSync(RoutingModule.PACKAGE_ROOT)).toBe(true);
    });
  });

  describe("configurePublishables", () => {
    it("registers exactly one tag: `routing-config`", () => {
      const consumer = makeSpyConsumer();
      RoutingModule.configurePublishables(consumer);

      expect(consumer.entries.length).toBe(1);
      expect(consumer.entries[0]?.tag).toBe("routing-config");
    });

    it("ships the reference `config/routing.config.ts` file", () => {
      const consumer = makeSpyConsumer();
      RoutingModule.configurePublishables(consumer);
      const files = consumer.entries[0]?.files ?? [];
      const paths = files.map((f) => (typeof f === "string" ? f : f.from));
      expect(paths).toContain("config/routing.config.ts");
    });

    it("does NOT declare packageRoot on the entry (relies on the class static)", () => {
      const consumer = makeSpyConsumer();
      RoutingModule.configurePublishables(consumer);
      expect(consumer.entries[0]?.packageRoot).toBeUndefined();
    });
  });
});
