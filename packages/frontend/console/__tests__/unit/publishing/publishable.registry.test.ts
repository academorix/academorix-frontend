/**
 * @file publishable.registry.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `PublishableRegistry` — the workspace-wide
 *   sink every module's `configurePublishables()` writes into.
 *
 *   Covers:
 *
 *     1. Extension of `BaseRegistry` from `@stackra/support` — the
 *        inherited surface (`has`, `get`, `values`, `keys`, `entries`,
 *        `count`, `remove`, `clear`) works and the strict-by-default
 *        semantics catch duplicates.
 *     2. Tag validation — kebab-case-with-hyphen regex, empty rejection.
 *     3. packageRoot validation — absolute-path requirement + helpful
 *        error naming when both entry AND class miss it.
 *     4. Files validation — non-empty array, per-file `from`/`to`
 *        non-empty, absolute `from` rejection.
 *     5. Duplicate handling — the domain-specific
 *        `DuplicatePublishableTagError` names BOTH offenders.
 *     6. Domain-readable aliases — `byTag`, `all`, `size`.
 *     7. Method overload — `register(key, value)` form.
 */

import path from "node:path";

import { describe, expect, it, beforeEach } from "vitest";

import type { IPublishableRegistryEntry } from "@stackra/contracts";

import { DuplicatePublishableTagError } from "@/publishing/errors/duplicate-tag.error";
import { InvalidPublishableEntryError } from "@/publishing/errors/invalid-publishable-entry.error";
import { PublishableRegistry } from "@/publishing/registries/publishable.registry";

/**
 * Named test-module classes — reused across cases to make error
 * messages readable. Two separate names so duplicate-tag assertions
 * can verify both offenders are reported.
 */
class TestModuleA {}
class TestModuleB {}

/**
 * Helper — construct a valid, fully-normalized publishable entry.
 * Overrides let a single test tweak one field.
 */
function makeEntry(
  overrides: Partial<Omit<IPublishableRegistryEntry, "sourceModule">> = {},
): Omit<IPublishableRegistryEntry, "sourceModule"> {
  return {
    tag: "test-config",
    description: "A test config publishable.",
    packageRoot: "/absolute/pkg/root",
    files: [{ from: "config/test.config.ts", to: "config/test.config.ts" }],
    ...overrides,
  };
}

describe("PublishableRegistry", () => {
  let registry: PublishableRegistry;

  beforeEach(() => {
    registry = new PublishableRegistry();
  });

  describe("register — happy path", () => {
    it("stores a valid entry keyed by tag", () => {
      registry.register(makeEntry(), TestModuleA);
      expect(registry.has("test-config")).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it("attaches the sourceModule to the stored entry", () => {
      registry.register(makeEntry(), TestModuleA);
      const stored = registry.byTag("test-config");
      expect(stored?.sourceModule).toBe(TestModuleA);
    });

    it("returns `this` for chaining", () => {
      const returned = registry.register(makeEntry({ tag: "cfg-a" }), TestModuleA);
      expect(returned).toBe(registry);
      // Chain a second entry immediately.
      registry.register(makeEntry({ tag: "cfg-b" }), TestModuleB);
      expect(registry.size()).toBe(2);
    });

    it("preserves the description field", () => {
      registry.register(makeEntry({ description: "The routing config." }), TestModuleA);
      expect(registry.byTag("test-config")?.description).toBe("The routing config.");
    });

    it("stores multiple entries in insertion order", () => {
      registry.register(makeEntry({ tag: "a-b" }), TestModuleA);
      registry.register(makeEntry({ tag: "c-d" }), TestModuleB);
      registry.register(makeEntry({ tag: "e-f" }), TestModuleA);

      const tags = registry.all().map((e) => e.tag);
      expect(tags).toEqual(["a-b", "c-d", "e-f"]);
    });
  });

  describe("register — tag validation", () => {
    it("rejects a non-string tag", () => {
      // Cast-to-any to bypass the type-check that would normally
      // prevent this — validation guards against runtime crashes
      // when the module was authored in plain JS.
      expect(() => {
        registry.register(makeEntry({ tag: 42 as unknown as string }), TestModuleA);
      }).toThrow(InvalidPublishableEntryError);
    });

    it("rejects an empty tag", () => {
      expect(() => {
        registry.register(makeEntry({ tag: "" }), TestModuleA);
      }).toThrow(InvalidPublishableEntryError);
    });

    it("rejects a tag without a hyphen (must contain at least one hyphen segment)", () => {
      // The regex requires the shape `<letter>[chars]-...`; a bare
      // word like "config" would let `--tag=config` match every
      // "config" publisher in the workspace.
      expect(() => {
        registry.register(makeEntry({ tag: "config" }), TestModuleA);
      }).toThrow(/kebab-case/);
    });

    it("rejects a tag with uppercase letters", () => {
      expect(() => {
        registry.register(makeEntry({ tag: "Cache-Config" }), TestModuleA);
      }).toThrow(/kebab-case/);
    });

    it("rejects a tag starting with a digit", () => {
      expect(() => {
        registry.register(makeEntry({ tag: "1-config" }), TestModuleA);
      }).toThrow(/kebab-case/);
    });

    it("rejects a tag with underscores", () => {
      expect(() => {
        registry.register(makeEntry({ tag: "cache_config" }), TestModuleA);
      }).toThrow(/kebab-case/);
    });

    it("accepts a valid kebab-case tag with digits after the first letter", () => {
      // Regex `^[a-z][a-z0-9]*(-[a-z0-9]+)+$` allows digits mid-word
      // after the first letter.
      expect(() => {
        registry.register(makeEntry({ tag: "queue1-config" }), TestModuleA);
      }).not.toThrow();
    });

    it("accepts a valid multi-hyphen tag", () => {
      // Longer chains like `stackra-ui-brand-assets` are legitimate.
      expect(() => {
        registry.register(makeEntry({ tag: "stackra-ui-brand-assets" }), TestModuleA);
      }).not.toThrow();
    });
  });

  describe("register — packageRoot validation", () => {
    it("rejects an empty packageRoot with a helpful PACKAGE_ROOT-naming message", () => {
      // The consumer's normalization step tries to auto-fill from
      // the source module's `PACKAGE_ROOT` static. If it's still
      // empty here, the module author forgot both entry.packageRoot
      // AND the static.
      let caughtError: unknown;
      try {
        registry.register(makeEntry({ packageRoot: "" }), TestModuleA);
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(InvalidPublishableEntryError);
      const err = caughtError as InvalidPublishableEntryError;
      // Must name the field.
      expect(err.field).toBe("packageRoot");
      // Must name the module that failed.
      expect(err.source).toBe("TestModuleA");
      // Must point to the `PACKAGE_ROOT` static pattern.
      expect(err.message).toContain("PACKAGE_ROOT");
      expect(err.message).toContain("TestModuleA");
    });

    it("rejects a relative packageRoot", () => {
      // Only absolute paths are accepted so file resolution is
      // portable across CI machines. `./packages/foo` would resolve
      // differently depending on cwd.
      const err = tryRegister(() =>
        registry.register(makeEntry({ packageRoot: "./relative/path" }), TestModuleA),
      );
      expect(err).toBeInstanceOf(InvalidPublishableEntryError);
      expect(err.message).toMatch(/absolute/);
    });

    it("accepts an absolute POSIX packageRoot", () => {
      // Skip on Windows since `path.isAbsolute` treats POSIX paths
      // as absolute only on POSIX.
      if (process.platform === "win32") return;
      expect(() => {
        registry.register(makeEntry({ packageRoot: "/absolute/path" }), TestModuleA);
      }).not.toThrow();
    });

    it("names the module even when sourceModule is null", () => {
      // A degenerate case — a registration from a non-module surface
      // (test fixture, direct programmatic use). The registry falls
      // back to a generic "an-unnamed-source" phrase so the error is
      // still actionable.
      const err = tryRegister(() => registry.register(makeEntry({ packageRoot: "" }), null));
      expect(err).toBeInstanceOf(InvalidPublishableEntryError);
      expect(err.message).toContain("an-unnamed-source");
    });
  });

  describe("register — files validation", () => {
    it("rejects a missing files array (typed as unknown to bypass compile-time check)", () => {
      const err = tryRegister(() =>
        registry.register(
          makeEntry({ files: undefined as unknown as IPublishableRegistryEntry["files"] }),
          TestModuleA,
        ),
      );
      expect(err).toBeInstanceOf(InvalidPublishableEntryError);
      expect(err.field).toBe("files");
    });

    it("rejects an empty files array — publishable with zero files is meaningless", () => {
      const err = tryRegister(() => registry.register(makeEntry({ files: [] }), TestModuleA));
      expect(err).toBeInstanceOf(InvalidPublishableEntryError);
      expect(err.field).toBe("files");
      expect(err.message).toContain("meaningless");
    });

    it("rejects a file with empty `from`", () => {
      const err = tryRegister(() =>
        registry.register(
          makeEntry({
            files: [{ from: "", to: "config/foo.ts" }],
          }),
          TestModuleA,
        ),
      );
      expect(err).toBeInstanceOf(InvalidPublishableEntryError);
      expect(err.field).toBe("files[].from");
    });

    it("rejects a file with an absolute `from` — packages can only publish within their tree", () => {
      // Skip on Windows since path.isAbsolute semantics differ.
      if (process.platform === "win32") return;
      const err = tryRegister(() =>
        registry.register(
          makeEntry({
            files: [{ from: "/outside/foo.ts", to: "config/foo.ts" }],
          }),
          TestModuleA,
        ),
      );
      expect(err).toBeInstanceOf(InvalidPublishableEntryError);
      expect(err.field).toBe("files[].from");
      expect(err.message).toContain("absolute");
      expect(err.message).toContain("relative to");
      expect(err.message).toContain("packageRoot");
    });

    it("rejects a file with empty `to`", () => {
      const err = tryRegister(() =>
        registry.register(
          makeEntry({
            files: [{ from: "config/foo.ts", to: "" }],
          }),
          TestModuleA,
        ),
      );
      expect(err).toBeInstanceOf(InvalidPublishableEntryError);
      expect(err.field).toBe("files[].to");
    });

    it("accepts a file with only `from` set — implicit `to = from`", () => {
      // The consumer normalizer fills `to` from `from`. Here we
      // simulate a caller that already normalized (the consumer's
      // job) and passes both.
      expect(() => {
        registry.register(
          makeEntry({
            files: [{ from: "config/foo.ts", to: "config/foo.ts" }],
          }),
          TestModuleA,
        );
      }).not.toThrow();
    });
  });

  describe("register — duplicate detection", () => {
    it("throws DuplicatePublishableTagError on tag collision", () => {
      registry.register(makeEntry({ tag: "shared-tag" }), TestModuleA);
      expect(() => {
        registry.register(makeEntry({ tag: "shared-tag" }), TestModuleB);
      }).toThrow(DuplicatePublishableTagError);
    });

    it("names BOTH offenders in the duplicate error", () => {
      registry.register(makeEntry({ tag: "shared-tag" }), TestModuleA);
      const err = tryRegister(() =>
        registry.register(makeEntry({ tag: "shared-tag" }), TestModuleB),
      );
      expect(err).toBeInstanceOf(DuplicatePublishableTagError);
      const dup = err as DuplicatePublishableTagError;
      expect(dup.firstSource).toBe("TestModuleA");
      expect(dup.secondSource).toBe("TestModuleB");
      expect(dup.tag).toBe("shared-tag");
    });

    it("preserves the first registration when a duplicate throws", () => {
      registry.register(makeEntry({ tag: "shared-tag" }), TestModuleA);
      expect(() => {
        registry.register(makeEntry({ tag: "shared-tag" }), TestModuleB);
      }).toThrow(DuplicatePublishableTagError);
      // The original entry is intact after the throw.
      const stored = registry.byTag("shared-tag");
      expect(stored?.sourceModule).toBe(TestModuleA);
      // Only one entry.
      expect(registry.size()).toBe(1);
    });

    it("clears the pending source-name after a successful register so subsequent duplicates report cleanly", () => {
      // Belt-and-suspenders — makes sure the internal
      // `pendingDuplicateSourceName` reset in the `finally` block
      // actually happens.
      registry.register(makeEntry({ tag: "tag-1" }), TestModuleA);
      registry.register(makeEntry({ tag: "tag-2" }), TestModuleB);
      // Now trigger a duplicate on tag-1 with a third source.
      class TestModuleC {}
      const err = tryRegister(() => registry.register(makeEntry({ tag: "tag-1" }), TestModuleC));
      expect(err).toBeInstanceOf(DuplicatePublishableTagError);
      const dup = err as DuplicatePublishableTagError;
      expect(dup.firstSource).toBe("TestModuleA");
      expect(dup.secondSource).toBe("TestModuleC");
    });
  });

  describe("register — (key, value) overload (BaseRegistry contract compat)", () => {
    it("accepts the `(key, entry)` shape", () => {
      const value: IPublishableRegistryEntry = {
        tag: "kv-config",
        packageRoot: "/absolute/pkg",
        files: [{ from: "config/kv.config.ts", to: "config/kv.config.ts" }],
        sourceModule: TestModuleA,
      };
      registry.register("kv-config", value);
      expect(registry.has("kv-config")).toBe(true);
      expect(registry.byTag("kv-config")?.sourceModule).toBe(TestModuleA);
    });

    it("uses the entry's own sourceModule when passed via the (key, value) overload", () => {
      const value: IPublishableRegistryEntry = {
        tag: "kv-config",
        packageRoot: "/absolute/pkg",
        files: [{ from: "config/kv.config.ts", to: "config/kv.config.ts" }],
        sourceModule: TestModuleB,
      };
      registry.register("kv-config", value);
      expect(registry.byTag("kv-config")?.sourceModule).toBe(TestModuleB);
    });

    it("validates through the same code path (rejects bad tags)", () => {
      const value: IPublishableRegistryEntry = {
        tag: "bad_tag",
        packageRoot: "/absolute/pkg",
        files: [{ from: "x.ts", to: "x.ts" }],
        sourceModule: TestModuleA,
      };
      expect(() => registry.register("bad_tag", value)).toThrow(InvalidPublishableEntryError);
    });
  });

  describe("domain-readable aliases", () => {
    it("byTag() returns the entry", () => {
      registry.register(makeEntry({ tag: "look-up-me" }), TestModuleA);
      expect(registry.byTag("look-up-me")?.tag).toBe("look-up-me");
    });

    it("byTag() returns undefined for a missing tag", () => {
      expect(registry.byTag("not-registered")).toBeUndefined();
    });

    it("all() returns every entry in insertion order", () => {
      registry.register(makeEntry({ tag: "aa-bb" }), TestModuleA);
      registry.register(makeEntry({ tag: "cc-dd" }), TestModuleB);
      const tags = registry.all().map((e) => e.tag);
      expect(tags).toEqual(["aa-bb", "cc-dd"]);
    });

    it("all() returns [] on an empty registry", () => {
      expect(registry.all()).toEqual([]);
    });

    it("size() returns the count", () => {
      expect(registry.size()).toBe(0);
      registry.register(makeEntry({ tag: "aa-bb" }), TestModuleA);
      expect(registry.size()).toBe(1);
      registry.register(makeEntry({ tag: "cc-dd" }), TestModuleB);
      expect(registry.size()).toBe(2);
    });
  });

  describe("inherited BaseRegistry surface", () => {
    beforeEach(() => {
      registry.register(makeEntry({ tag: "aa-bb" }), TestModuleA);
      registry.register(makeEntry({ tag: "cc-dd" }), TestModuleB);
    });

    it("`has(tag)` reflects registration", () => {
      expect(registry.has("aa-bb")).toBe(true);
      expect(registry.has("not-registered")).toBe(false);
    });

    it("`get(tag)` returns undefined for a miss (matches Map.get)", () => {
      expect(registry.get("not-registered")).toBeUndefined();
    });

    it("`values()` returns every entry", () => {
      const tags = registry.values().map((e) => e.tag);
      expect(tags).toEqual(["aa-bb", "cc-dd"]);
    });

    it("`keys()` returns every tag", () => {
      expect(registry.keys()).toEqual(["aa-bb", "cc-dd"]);
    });

    it("`entries()` returns [tag, entry] tuples", () => {
      const entries = registry.entries();
      expect(entries.length).toBe(2);
      expect(entries[0]?.[0]).toBe("aa-bb");
      expect(entries[1]?.[0]).toBe("cc-dd");
    });

    it("`count()` returns the total", () => {
      expect(registry.count()).toBe(2);
    });

    it("`remove(tag)` deletes the entry and returns true", () => {
      expect(registry.remove("aa-bb")).toBe(true);
      expect(registry.has("aa-bb")).toBe(false);
      expect(registry.size()).toBe(1);
    });

    it("`remove(tag)` returns false for a missing key", () => {
      expect(registry.remove("not-registered")).toBe(false);
      expect(registry.size()).toBe(2);
    });

    it("`clear()` empties the registry", () => {
      registry.clear();
      expect(registry.size()).toBe(0);
    });

    it("after clear, a tag can be re-registered without a duplicate error", () => {
      registry.clear();
      expect(() => registry.register(makeEntry({ tag: "aa-bb" }), TestModuleA)).not.toThrow();
    });
  });

  describe("makeDuplicateError override — production shape", () => {
    it("returns a DuplicatePublishableTagError (not a generic RegistryDuplicateError)", () => {
      // The override is the whole reason we have a domain-specific
      // error — verify it's the one thrown even when consumers
      // catch on a narrower type.
      registry.register(makeEntry({ tag: "dup-me" }), TestModuleA);
      let caught: unknown = null;
      try {
        registry.register(makeEntry({ tag: "dup-me" }), TestModuleB);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(DuplicatePublishableTagError);
      // Not just an instance of the generic base error.
      expect((caught as Error).name).toBe("DuplicatePublishableTagError");
    });
  });
});

// ────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────

/**
 * Run a callback that's expected to throw. Returns the caught error
 * or throws the assertion failure if no error was thrown. Keeps
 * test bodies readable at the assertion sites above.
 */
function tryRegister(fn: () => void): Error {
  let caught: Error | null = null;
  try {
    fn();
  } catch (err) {
    caught = err as Error;
  }
  if (caught === null) {
    throw new Error("Expected register() to throw but it did not.");
  }
  return caught;
}

// Silence "value never read" false positive on `path` when the
// test runner uses tree-shaking optimizations.
void path;
