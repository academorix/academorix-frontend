/**
 * @file console.module.publishables.test.ts
 * @module @stackra/console/tests
 * @description Verifies the module-level `configurePublishables()`
 *   manifest and `PACKAGE_ROOT` contract on `ConsoleModule`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import type { IPublishableConsumer, IPublishableEntry } from "@stackra/contracts";

import { ConsoleModule } from "@/console.module";

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

describe("ConsoleModule.PACKAGE_ROOT + configurePublishables", () => {
  describe("PACKAGE_ROOT", () => {
    it("is a non-empty absolute path", () => {
      expect(typeof ConsoleModule.PACKAGE_ROOT).toBe("string");
      expect(ConsoleModule.PACKAGE_ROOT.length).toBeGreaterThan(0);
      expect(path.isAbsolute(ConsoleModule.PACKAGE_ROOT)).toBe(true);
    });

    it("resolves to an existing directory on disk", () => {
      expect(existsSync(ConsoleModule.PACKAGE_ROOT)).toBe(true);
    });
  });

  describe("configurePublishables", () => {
    it("registers exactly one tag: `console-stubs`", () => {
      const consumer = makeSpyConsumer();
      ConsoleModule.configurePublishables(consumer);

      expect(consumer.entries.length).toBe(1);
      expect(consumer.entries[0]?.tag).toBe("console-stubs");
    });

    it("ships all three make-command stubs (command.ejs, module.ejs, service.ejs)", () => {
      // `make:command`, `make:module`, `make:service` all rely on
      // their own stub — the console publishable manifest MUST
      // reference all three or a downstream `make:*` in a consumer
      // package silently fails.
      const consumer = makeSpyConsumer();
      ConsoleModule.configurePublishables(consumer);
      const files = consumer.entries[0]?.files ?? [];
      const paths = files.map((f) => (typeof f === "string" ? f : f.from));
      expect(paths).toContain("stubs/command.ejs");
      expect(paths).toContain("stubs/module.ejs");
      expect(paths).toContain("stubs/service.ejs");
    });

    it("ships a description and at least one file", () => {
      const consumer = makeSpyConsumer();
      ConsoleModule.configurePublishables(consumer);
      const [entry] = consumer.entries;
      expect((entry?.description ?? "").length).toBeGreaterThan(0);
      expect((entry?.files ?? []).length).toBeGreaterThan(0);
    });

    it("does NOT declare packageRoot on the entry (relies on the class static)", () => {
      const consumer = makeSpyConsumer();
      ConsoleModule.configurePublishables(consumer);
      expect(consumer.entries[0]?.packageRoot).toBeUndefined();
    });
  });
});
