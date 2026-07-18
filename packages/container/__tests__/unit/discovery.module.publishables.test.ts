/**
 * @file discovery.module.publishables.test.ts
 * @module @stackra/container/tests
 * @description Verifies the module-level `configurePublishables()`
 *   manifest and `PACKAGE_ROOT` contract on `DiscoveryModule`.
 *
 *   `@stackra/container` ships TWO publishable tags — one for the
 *   `ApplicationFactory.create()` config (`application.config.ts`)
 *   and one for the container runtime config (`container.config.ts`).
 *   Consumers publish each separately.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { DiscoveryModule } from "@/core/discovery/discovery.module";

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

describe("DiscoveryModule.PACKAGE_ROOT + configurePublishables", () => {
  describe("PACKAGE_ROOT", () => {
    it("is a non-empty absolute path", () => {
      expect(typeof DiscoveryModule.PACKAGE_ROOT).toBe("string");
      expect(DiscoveryModule.PACKAGE_ROOT.length).toBeGreaterThan(0);
      expect(path.isAbsolute(DiscoveryModule.PACKAGE_ROOT)).toBe(true);
    });

    it("resolves to an existing directory on disk", () => {
      expect(existsSync(DiscoveryModule.PACKAGE_ROOT)).toBe(true);
    });
  });

  describe("configurePublishables — two entries", () => {
    it("registers exactly TWO tags (application + container config)", () => {
      const consumer = makeSpyConsumer();
      DiscoveryModule.configurePublishables(consumer);

      expect(consumer.entries.length).toBe(2);
    });

    it("registers the `container-application-config` tag", () => {
      const consumer = makeSpyConsumer();
      DiscoveryModule.configurePublishables(consumer);
      const tags = consumer.entries.map((e) => e.tag);
      expect(tags).toContain("container-application-config");
    });

    it("registers the `container-config` tag", () => {
      const consumer = makeSpyConsumer();
      DiscoveryModule.configurePublishables(consumer);
      const tags = consumer.entries.map((e) => e.tag);
      expect(tags).toContain("container-config");
    });

    it("the two entries ship different files", () => {
      const consumer = makeSpyConsumer();
      DiscoveryModule.configurePublishables(consumer);
      const files = consumer.entries.map((e) =>
        (e.files ?? []).map((f) => (typeof f === "string" ? f : f.from)),
      );
      // Each tag must reference distinct files — never the same
      // physical file under two tags.
      const flat = files.flat();
      expect(new Set(flat).size).toBe(flat.length);
    });

    it("neither entry declares packageRoot on itself (both rely on the class static)", () => {
      const consumer = makeSpyConsumer();
      DiscoveryModule.configurePublishables(consumer);
      for (const entry of consumer.entries) {
        expect(entry.packageRoot).toBeUndefined();
      }
    });

    it("chaining — consumer.publish returns the same consumer for both calls", () => {
      // DiscoveryModule uses the fluent chain
      // `consumer.publish(...).publish(...)`. Verify each call's
      // return value matches the consumer we passed in.
      const consumer = makeSpyConsumer();
      DiscoveryModule.configurePublishables(consumer);
      // Each mock call's return value should be `consumer`.
      const returns = (consumer.publish as unknown as {
        mock: { results: Array<{ value: unknown }> };
      }).mock.results.map((r) => r.value);
      expect(returns).toEqual([consumer, consumer]);
    });
  });
});
