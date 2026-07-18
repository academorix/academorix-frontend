/**
 * @file publishable.consumer.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `PublishableConsumer` — the fluent
 *   builder the loader hands to each module's
 *   `static configurePublishables(consumer)` method.
 *
 *   The consumer is deliberately thin: its whole job is to normalize
 *   author-facing conveniences (string `files[]` shorthand, missing
 *   `to`, auto-fill `packageRoot` from `sourceModule.PACKAGE_ROOT`)
 *   before delegating to `PublishableRegistry.register`.
 *
 *   Covers:
 *
 *     1. `packageRoot` auto-fill from `sourceModule.PACKAGE_ROOT`.
 *     2. Explicit `entry.packageRoot` wins over the class static.
 *     3. String `files[]` shorthand → `[{ from: 'x', to: 'x' }]`.
 *     4. Object-form file without `to` → fills `to = from`.
 *     5. Object-form file with explicit `to` is passed through.
 *     6. Mixed string + object `files[]` entries normalize side-by-side.
 *     7. Chaining — `.publish(...)` returns `this`.
 *     8. `sourceModule = null` — degenerate case, no auto-fill.
 *     9. Non-string `PACKAGE_ROOT` — falls through silently, defers
 *        the error to the registry with a helpful message.
 */

import { describe, expect, it, beforeEach } from "vitest";

import { PublishableConsumer } from "@/publishing/publishable.consumer";
import { PublishableRegistry } from "@/publishing/registries/publishable.registry";

import type { IPublishableEntry, IPublishableRegistryEntry, Type } from "@stackra/contracts";

/**
 * Named modules used in the assertions. Each carries a different
 * `PACKAGE_ROOT` so we can trace which module's static was read.
 */
class ModuleWithRoot {
  public static readonly PACKAGE_ROOT = "/abs/module-with-root";
}

class ModuleWithoutRoot {}

class ModuleWithNonStringRoot {
  // Intentionally wrong shape — the consumer should NOT crash on
  // this; it defers to the registry which throws a helpful error.
  public static readonly PACKAGE_ROOT = 42 as unknown as string;
}

describe("PublishableConsumer", () => {
  let registry: PublishableRegistry;

  beforeEach(() => {
    registry = new PublishableRegistry();
  });

  describe("packageRoot auto-fill", () => {
    it("reads `sourceModule.PACKAGE_ROOT` when the entry omits `packageRoot`", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      const entry: IPublishableEntry = {
        tag: "cfg-a",
        // packageRoot deliberately omitted
        files: [{ from: "config/a.ts" }],
      };
      consumer.publish(entry);
      expect(registry.byTag("cfg-a")?.packageRoot).toBe("/abs/module-with-root");
    });

    it("explicit entry.packageRoot wins over the class static", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-explicit",
        packageRoot: "/abs/explicit-override",
        files: [{ from: "config/a.ts" }],
      });
      expect(registry.byTag("cfg-explicit")?.packageRoot).toBe("/abs/explicit-override");
    });

    it("falls through to empty string when class has no PACKAGE_ROOT (registry then rejects with a helpful message)", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithoutRoot as Type<unknown>);
      // The registry throws — but the throw carries an actionable
      // message that names `PACKAGE_ROOT` and the module.
      expect(() =>
        consumer.publish({
          tag: "cfg-a",
          files: [{ from: "config/a.ts" }],
        }),
      ).toThrow(/PACKAGE_ROOT/);
    });

    it("falls through to empty string when class has a NON-string PACKAGE_ROOT", () => {
      // Duck-typing check: only `typeof staticRoot === 'string'`
      // triggers auto-fill. A wrongly-typed value (number, object)
      // is treated the same as no static at all — the registry
      // throws its own helpful error.
      const consumer = new PublishableConsumer(
        registry,
        ModuleWithNonStringRoot as unknown as Type<unknown>,
      );
      expect(() =>
        consumer.publish({
          tag: "cfg-a",
          files: [{ from: "config/a.ts" }],
        }),
      ).toThrow(/PACKAGE_ROOT/);
    });

    it("`sourceModule = null` — no auto-fill, entry must supply packageRoot", () => {
      const consumer = new PublishableConsumer(registry, null);
      // With no source module, the caller MUST supply packageRoot.
      expect(() =>
        consumer.publish({
          tag: "cfg-a",
          files: [{ from: "config/a.ts" }],
        }),
      ).toThrow(/PACKAGE_ROOT/);
      // With an explicit packageRoot, the null-sourceModule case
      // works fine.
      const consumerB = new PublishableConsumer(registry, null);
      expect(() =>
        consumerB.publish({
          tag: "cfg-explicit",
          packageRoot: "/abs/explicit",
          files: [{ from: "config/a.ts" }],
        }),
      ).not.toThrow();
    });
  });

  describe("files[] normalization — string shorthand", () => {
    it("normalizes a string entry to `{ from: 'x', to: 'x' }`", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-shorthand",
        files: ["config/queue.config.ts"],
      });
      const stored = registry.byTag("cfg-shorthand");
      expect(stored?.files).toEqual([
        { from: "config/queue.config.ts", to: "config/queue.config.ts" },
      ]);
    });

    it("normalizes multiple string entries", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-shorthand",
        files: [
          "config/queue.config.ts",
          "stubs/processor.ejs",
          "stubs/scheduler.ejs",
        ],
      });
      const stored = registry.byTag("cfg-shorthand");
      expect(stored?.files).toEqual([
        { from: "config/queue.config.ts", to: "config/queue.config.ts" },
        { from: "stubs/processor.ejs", to: "stubs/processor.ejs" },
        { from: "stubs/scheduler.ejs", to: "stubs/scheduler.ejs" },
      ]);
    });
  });

  describe("files[] normalization — object shorthand", () => {
    it("fills `to = from` when `to` is omitted", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-obj-no-to",
        files: [{ from: "config/queue.config.ts" }],
      });
      const stored = registry.byTag("cfg-obj-no-to");
      expect(stored?.files).toEqual([
        { from: "config/queue.config.ts", to: "config/queue.config.ts" },
      ]);
    });

    it("preserves an explicit `to`", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-obj-with-to",
        files: [{ from: "stubs/processor.ejs", to: "app/stubs/processor.ejs" }],
      });
      const stored = registry.byTag("cfg-obj-with-to");
      expect(stored?.files).toEqual([
        { from: "stubs/processor.ejs", to: "app/stubs/processor.ejs" },
      ]);
    });

    it("preserves the `render` flag when explicitly set", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-obj-with-render",
        files: [{ from: "stubs/processor.txt", to: "stubs/processor.txt", render: true }],
      });
      const stored = registry.byTag("cfg-obj-with-render");
      expect(stored?.files[0]?.render).toBe(true);
    });

    it("preserves `render: false` (opt-out of `.ejs` template rendering)", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-no-render",
        files: [{ from: "stubs/verbatim.ejs", to: "stubs/verbatim.ejs", render: false }],
      });
      const stored = registry.byTag("cfg-no-render");
      expect(stored?.files[0]?.render).toBe(false);
    });
  });

  describe("files[] normalization — mixed forms", () => {
    it("normalizes a mixed string + object files array", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-mixed",
        files: [
          "config/queue.config.ts",
          { from: "stubs/processor.ejs", to: "app/stubs/processor.ejs" },
          { from: "stubs/scheduler.ejs", render: false },
        ],
      });
      const stored = registry.byTag("cfg-mixed");
      expect(stored?.files).toEqual([
        { from: "config/queue.config.ts", to: "config/queue.config.ts" },
        { from: "stubs/processor.ejs", to: "app/stubs/processor.ejs" },
        { from: "stubs/scheduler.ejs", to: "stubs/scheduler.ejs", render: false },
      ]);
    });
  });

  describe("chaining", () => {
    it("returns `this` so calls can be chained", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      const result = consumer.publish({ tag: "cfg-a", files: ["a.ts"] });
      expect(result).toBe(consumer);
      // Chain two more.
      consumer
        .publish({ tag: "cfg-b", files: ["b.ts"] })
        .publish({ tag: "cfg-c", files: ["c.ts"] });
      expect(registry.size()).toBe(3);
      expect(registry.keys()).toEqual(["cfg-a", "cfg-b", "cfg-c"]);
    });
  });

  describe("sourceModule attribution — passed to registry", () => {
    it("the registered entry carries the source module the consumer was constructed with", () => {
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({ tag: "cfg-a", files: ["a.ts"] });
      expect(registry.byTag("cfg-a")?.sourceModule).toBe(ModuleWithRoot);
    });

    it("each consumer pins a DIFFERENT sourceModule (no state bleed)", () => {
      class ModA {
        public static readonly PACKAGE_ROOT = "/abs/mod-a";
      }
      class ModB {
        public static readonly PACKAGE_ROOT = "/abs/mod-b";
      }
      const consumerA = new PublishableConsumer(registry, ModA as Type<unknown>);
      const consumerB = new PublishableConsumer(registry, ModB as Type<unknown>);
      consumerA.publish({ tag: "cfg-a", files: ["a.ts"] });
      consumerB.publish({ tag: "cfg-b", files: ["b.ts"] });
      expect(registry.byTag("cfg-a")?.sourceModule).toBe(ModA);
      expect(registry.byTag("cfg-b")?.sourceModule).toBe(ModB);
    });
  });

  describe("normalization ordering — packageRoot then files", () => {
    it("passes the FULLY-NORMALIZED entry to the registry", () => {
      // Behavioural check — after `publish`, the registry sees the
      // canonical shape (packageRoot filled, every file object).
      const consumer = new PublishableConsumer(registry, ModuleWithRoot as Type<unknown>);
      consumer.publish({
        tag: "cfg-norm",
        files: ["a.ts", { from: "b.ts" }, { from: "c.ts", to: "override/c.ts" }],
      });
      const stored: IPublishableRegistryEntry = registry.byTag("cfg-norm")!;
      // Packageroot filled.
      expect(stored.packageRoot).toBe("/abs/module-with-root");
      // Every files entry is an object with both `from` and `to`.
      for (const f of stored.files) {
        expect(typeof f.from).toBe("string");
        expect(typeof f.to).toBe("string");
        expect(f.from.length).toBeGreaterThan(0);
        expect(f.to?.length ?? 0).toBeGreaterThan(0);
      }
    });
  });
});
