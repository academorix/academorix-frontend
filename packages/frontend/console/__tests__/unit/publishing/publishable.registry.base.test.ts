/**
 * @file publishable.registry.base.test.ts
 * @module @stackra/console/tests
 * @description Extended tests for `PublishableRegistry` focused on
 *   BaseRegistry-adoption spot-checks that the main
 *   `publishable.registry.test.ts` doesn't explicitly cover:
 *
 *   - `onRegister` hook fires exactly once per successful register.
 *   - `makeDuplicateError` still returns the domain-specific error
 *     class even when the caller uses the `(key, value)` form.
 *   - The domain error IS-A `RegistryDuplicateError` from
 *     `@stackra/support` — family kinship for catch-all consumers.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";

import type { IPublishableRegistryEntry } from "@stackra/contracts";

import { ConsoleError } from "@/errors";
import { DuplicatePublishableTagError } from "@/publishing/errors/duplicate-tag.error";
import { PublishableRegistry } from "@/publishing/registries/publishable.registry";

class OwnerModule {}

/**
 * A subclass that spies on the protected `onRegister` hook.
 */
class SpyPublishableRegistry extends PublishableRegistry {
  public readonly onRegisterSpy = vi.fn<[string, IPublishableRegistryEntry], void>();

  protected override onRegister(key: string, value: IPublishableRegistryEntry): void {
    super.onRegister(key, value);
    this.onRegisterSpy(key, value);
  }
}

function makeEntry(
  overrides: Partial<Omit<IPublishableRegistryEntry, "sourceModule">> = {},
): Omit<IPublishableRegistryEntry, "sourceModule"> {
  return {
    tag: "test-config",
    description: "Test.",
    packageRoot: "/absolute/pkg/root",
    files: [{ from: "config/test.config.ts", to: "config/test.config.ts" }],
    ...overrides,
  };
}

describe("PublishableRegistry — BaseRegistry adoption", () => {
  describe("onRegister lifecycle hook", () => {
    let spy: SpyPublishableRegistry;

    beforeEach(() => {
      spy = new SpyPublishableRegistry();
    });

    it("fires exactly once per successful register", () => {
      spy.register(makeEntry({ tag: "one-time" }), OwnerModule);
      expect(spy.onRegisterSpy).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire when register throws (validation failure)", () => {
      expect(() =>
        // Bad tag — the registry throws before onRegister runs.
        spy.register(makeEntry({ tag: "" }), OwnerModule),
      ).toThrow();
      expect(spy.onRegisterSpy).not.toHaveBeenCalled();
    });

    it("does NOT fire when register throws (duplicate)", () => {
      spy.register(makeEntry({ tag: "dup-me" }), OwnerModule);
      expect(spy.onRegisterSpy).toHaveBeenCalledTimes(1);
      expect(() => spy.register(makeEntry({ tag: "dup-me" }), OwnerModule)).toThrow();
      // Still exactly 1 — the failed second attempt didn't fire.
      expect(spy.onRegisterSpy).toHaveBeenCalledTimes(1);
    });

    it("receives the (tag, entry) pair after validation + normalization", () => {
      spy.register(makeEntry({ tag: "aa-bb" }), OwnerModule);
      const [key, value] = spy.onRegisterSpy.mock.calls[0] ?? [];
      expect(key).toBe("aa-bb");
      // `sourceModule` was fused in by the register method.
      expect(value?.sourceModule).toBe(OwnerModule);
    });
  });

  describe("makeDuplicateError override — invariants", () => {
    it("throws `DuplicatePublishableTagError`, NOT the generic `RegistryDuplicateError`", () => {
      const registry = new PublishableRegistry();
      registry.register(makeEntry({ tag: "dup-me" }), OwnerModule);
      let caught: unknown = null;
      try {
        registry.register(makeEntry({ tag: "dup-me" }), OwnerModule);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(DuplicatePublishableTagError);
      expect((caught as Error).name).toBe("DuplicatePublishableTagError");
    });

    it("`DuplicatePublishableTagError` extends `ConsoleError` — catch-all consumers still work", () => {
      const registry = new PublishableRegistry();
      registry.register(makeEntry({ tag: "dup-me" }), OwnerModule);
      let caught: unknown = null;
      try {
        registry.register(makeEntry({ tag: "dup-me" }), class Other {});
      } catch (err) {
        caught = err;
      }
      // Family kinship — the domain error inherits `ConsoleError`
      // so a top-level try/catch in the CLI kernel funnels it into
      // the same failure path as every other console error.
      expect(caught).toBeInstanceOf(ConsoleError);
    });

    it("survives the (key, value) overload — same error class thrown", () => {
      const registry = new PublishableRegistry();
      registry.register("dup-me", {
        tag: "dup-me",
        packageRoot: "/absolute/pkg",
        files: [{ from: "a.ts", to: "a.ts" }],
        sourceModule: OwnerModule,
      });
      let caught: unknown = null;
      try {
        registry.register("dup-me", {
          tag: "dup-me",
          packageRoot: "/absolute/pkg",
          files: [{ from: "b.ts", to: "b.ts" }],
          sourceModule: class Other {},
        });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(DuplicatePublishableTagError);
    });
  });

  describe("inherited BaseRegistry surface — sanity check for the domain-typed registry", () => {
    let registry: PublishableRegistry;

    beforeEach(() => {
      registry = new PublishableRegistry();
      registry.register(makeEntry({ tag: "aa-bb" }), OwnerModule);
      registry.register(makeEntry({ tag: "cc-dd" }), OwnerModule);
    });

    it("`values()` returns every entry in insertion order", () => {
      const tags = registry.values().map((e) => e.tag);
      expect(tags).toEqual(["aa-bb", "cc-dd"]);
    });

    it("`entries()` returns typed [tag, entry] tuples", () => {
      const entries = registry.entries();
      expect(entries[0]?.[0]).toBe("aa-bb");
      expect(entries[0]?.[1].tag).toBe("aa-bb");
    });

    it("`count()` returns the total", () => {
      expect(registry.count()).toBe(2);
    });

    it("`remove(tag)` returns true when the entry existed", () => {
      expect(registry.remove("aa-bb")).toBe(true);
      expect(registry.count()).toBe(1);
    });

    it("`clear()` empties the registry", () => {
      registry.clear();
      expect(registry.count()).toBe(0);
    });
  });
});
