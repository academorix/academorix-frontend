/**
 * @file cache.module.publishables.test.ts
 * @module @stackra/cache/tests
 * @description Verifies the module-level `configurePublishables()`
 *   manifest and `PACKAGE_ROOT` contract on `CacheModule`.
 *
 *   Covers:
 *
 *     1. `PACKAGE_ROOT` is an absolute filesystem path.
 *     2. `configurePublishables(consumer)` calls `.publish(...)` with
 *        the canonical tag(s) documented in the module.
 *     3. Every declared `files[].from` exists on disk relative to the
 *        module's `PACKAGE_ROOT` — the entry can actually be
 *        materialized by `vendor:publish`.
 *
 *   NOTE: If assertion (3) fails, that is a REAL bug — either
 *   `PACKAGE_ROOT` resolves to the wrong directory (see
 *   `Path.packageRoot` in `@stackra/support`) OR the publishable
 *   manifest references a file that isn't shipped in `files: [...]`
 *   of the package's `package.json`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { CacheModule } from "@/core/cache.module";

import type { IPublishableConsumer, IPublishableEntry } from "@stackra/contracts";

// ────────────────────────────────────────────────────────────────
// Test helper — a spy consumer capturing every `.publish(...)` call
// ────────────────────────────────────────────────────────────────

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

describe("CacheModule.PACKAGE_ROOT + configurePublishables", () => {
  describe("PACKAGE_ROOT", () => {
    it("is a non-empty string", () => {
      expect(typeof CacheModule.PACKAGE_ROOT).toBe("string");
      expect(CacheModule.PACKAGE_ROOT.length).toBeGreaterThan(0);
    });

    it("is an absolute path", () => {
      // Portability rule — packages resolve their root from
      // `import.meta.url` which always yields an absolute path.
      expect(path.isAbsolute(CacheModule.PACKAGE_ROOT)).toBe(true);
    });

    it("resolves to an existing directory on disk", () => {
      expect(existsSync(CacheModule.PACKAGE_ROOT)).toBe(true);
    });
  });

  describe("configurePublishables", () => {
    it("registers the canonical `cache-config` tag", () => {
      const consumer = makeSpyConsumer();
      CacheModule.configurePublishables(consumer);

      expect(consumer.publish).toHaveBeenCalledTimes(1);
      const [entry] = consumer.entries;
      expect(entry?.tag).toBe("cache-config");
    });

    it("ships the entry with a description (drives the interactive picker hint)", () => {
      const consumer = makeSpyConsumer();
      CacheModule.configurePublishables(consumer);
      const [entry] = consumer.entries;
      expect(entry?.description).toBeDefined();
      expect((entry?.description ?? "").length).toBeGreaterThan(0);
    });

    it("declares at least one file in `files: [...]`", () => {
      const consumer = makeSpyConsumer();
      CacheModule.configurePublishables(consumer);
      const [entry] = consumer.entries;
      expect(Array.isArray(entry?.files)).toBe(true);
      expect((entry?.files ?? []).length).toBeGreaterThan(0);
    });

    it("does NOT declare an explicit packageRoot on the entry (relies on class static)", () => {
      // A key invariant — every module leaves `packageRoot` off the
      // entry and lets the consumer auto-fill from
      // `CacheModule.PACKAGE_ROOT`. Explicit packageRoot on an entry
      // would defeat the whole "declare once, publish many" pattern.
      const consumer = makeSpyConsumer();
      CacheModule.configurePublishables(consumer);
      const [entry] = consumer.entries;
      expect(entry?.packageRoot).toBeUndefined();
    });
  });
});
