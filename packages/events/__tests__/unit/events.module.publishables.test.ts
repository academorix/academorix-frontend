/**
 * @file events.module.publishables.test.ts
 * @module @stackra/events/tests
 * @description Verifies the module-level `configurePublishables()`
 *   manifest and `PACKAGE_ROOT` contract on `EventEmitterModule`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { EventEmitterModule } from "@/core/events.module";

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

describe("EventEmitterModule.PACKAGE_ROOT + configurePublishables", () => {
  describe("PACKAGE_ROOT", () => {
    it("is a non-empty absolute path", () => {
      expect(typeof EventEmitterModule.PACKAGE_ROOT).toBe("string");
      expect(EventEmitterModule.PACKAGE_ROOT.length).toBeGreaterThan(0);
      expect(path.isAbsolute(EventEmitterModule.PACKAGE_ROOT)).toBe(true);
    });

    it("resolves to an existing directory on disk", () => {
      expect(existsSync(EventEmitterModule.PACKAGE_ROOT)).toBe(true);
    });
  });

  describe("configurePublishables", () => {
    it("registers exactly one tag: `events-config`", () => {
      const consumer = makeSpyConsumer();
      EventEmitterModule.configurePublishables(consumer);

      expect(consumer.entries.length).toBe(1);
      expect(consumer.entries[0]?.tag).toBe("events-config");
    });

    it("ships the reference `config/events.config.ts` file", () => {
      const consumer = makeSpyConsumer();
      EventEmitterModule.configurePublishables(consumer);
      const files = consumer.entries[0]?.files ?? [];
      const paths = files.map((f) => (typeof f === "string" ? f : f.from));
      expect(paths).toContain("config/events.config.ts");
    });

    it("does NOT declare packageRoot on the entry (relies on the class static)", () => {
      const consumer = makeSpyConsumer();
      EventEmitterModule.configurePublishables(consumer);
      expect(consumer.entries[0]?.packageRoot).toBeUndefined();
    });
  });
});
