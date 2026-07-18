/**
 * @file publishable-loader.service.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `PublishableLoader` — the
 *   `OnApplicationBootstrap` service that walks
 *   `IDiscoveryService.getModules()` and invokes each module's
 *   `static configurePublishables(consumer)` method.
 *
 *   The loader is deliberately thin: its only job is to iterate,
 *   duck-type, and delegate. The tests verify that dead-simple
 *   behaviour end-to-end using a hand-rolled `IDiscoveryService`
 *   stub (no container spin-up needed).
 *
 *   Covers:
 *
 *     1. Duck-typing — only modules with a static
 *        `configurePublishables` function are invoked.
 *     2. Fresh `PublishableConsumer` per module — no source-module
 *        bleed across modules.
 *     3. Correct `sourceModule` attribution in registered entries.
 *     4. Silent skip for modules that don't ship publishables (no
 *        error, no log).
 *     5. `this` binding preserved when invoking the static.
 *     6. Registration errors bubble out (fail-loud misconfiguration).
 *     7. Empty `getModules()` — nothing happens, no error.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";

import { PublishableConsumer } from "@/publishing/publishable.consumer";
import { PublishableLoader } from "@/publishing/services/publishable-loader.service";
import { PublishableRegistry } from "@/publishing/registries/publishable.registry";

import type { IDiscoveryProvider, IDiscoveryService, Type } from "@stackra/contracts";

// ────────────────────────────────────────────────────────────────
// Discovery-service stub
// ────────────────────────────────────────────────────────────────

/**
 * A hand-rolled `IDiscoveryService` — we only exercise
 * `getModules()` because that's the only method `PublishableLoader`
 * touches. `getProviders*` return empty arrays so the stub is
 * still contract-complete.
 */
class DiscoveryStub implements IDiscoveryService {
  public constructor(private readonly modules: readonly Type<unknown>[]) {}

  public getModules(): readonly Type<unknown>[] {
    return this.modules;
  }

  public getProviders(): IDiscoveryProvider[] {
    return [];
  }

  public getProvidersByMetadata(_key: string | symbol): IDiscoveryProvider[] {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────
// Test modules
// ────────────────────────────────────────────────────────────────

/** Module WITH publishables — the common case. */
class ModuleWithPublishables {
  public static readonly PACKAGE_ROOT = "/abs/module-a";
  public static readonly publishSpy = vi.fn();

  public static configurePublishables(consumer: {
    publish: (entry: unknown) => unknown;
  }): void {
    // Track the invocation for the assertions below.
    ModuleWithPublishables.publishSpy(consumer);
    consumer.publish({
      tag: "cfg-a",
      files: [{ from: "config/a.ts", to: "config/a.ts" }],
    });
  }
}

/** Module WITHOUT publishables — must be silently skipped. */
class ModuleWithoutPublishables {}

/** Module that publishes multiple entries — chaining test. */
class ModuleWithMultiplePublishables {
  public static readonly PACKAGE_ROOT = "/abs/module-multi";

  public static configurePublishables(consumer: {
    publish: (entry: unknown) => { publish: (entry: unknown) => unknown };
  }): void {
    consumer
      .publish({
        tag: "multi-a",
        files: [{ from: "config/a.ts", to: "config/a.ts" }],
      })
      .publish({
        tag: "multi-b",
        files: [{ from: "config/b.ts", to: "config/b.ts" }],
      });
  }
}

/** Module that throws inside its manifest — fail-loud semantics. */
class ModuleThatThrowsInside {
  public static readonly PACKAGE_ROOT = "/abs/thrower";

  public static configurePublishables(consumer: { publish: (entry: unknown) => unknown }): void {
    consumer.publish({
      // Bad tag — the registry will reject this at register time.
      tag: "not_kebab_case",
      files: [{ from: "config/x.ts", to: "config/x.ts" }],
    });
  }
}

/** Module with a NON-function `configurePublishables` — duck-typed out. */
class ModuleWithNonFunctionMember {
  public static readonly PACKAGE_ROOT = "/abs/wrong-type";
  // Deliberately not a function.
  public static readonly configurePublishables: unknown = "not-a-function";
}

/** Module that inspects `this` to prove the bind is preserved. */
class ModuleThatInspectsThis {
  public static readonly PACKAGE_ROOT = "/abs/this-check";
  public static readonly seenThis: { value: unknown } = { value: null };

  public static configurePublishables(this: unknown, consumer: {
    publish: (entry: unknown) => unknown;
  }): void {
    // Capture the `this` binding so the test can verify it's the class.
    ModuleThatInspectsThis.seenThis.value = this;
    consumer.publish({
      tag: "this-check",
      files: [{ from: "config/a.ts", to: "config/a.ts" }],
    });
  }
}

// ────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────

describe("PublishableLoader", () => {
  let registry: PublishableRegistry;

  beforeEach(() => {
    registry = new PublishableRegistry();
    ModuleWithPublishables.publishSpy.mockClear();
    ModuleThatInspectsThis.seenThis.value = null;
  });

  describe("iteration + duck-typing", () => {
    it("invokes `configurePublishables` on every module that has one", () => {
      const discovery = new DiscoveryStub([
        ModuleWithPublishables as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      loader.onApplicationBootstrap();

      expect(ModuleWithPublishables.publishSpy).toHaveBeenCalledTimes(1);
      expect(registry.has("cfg-a")).toBe(true);
    });

    it("silently skips modules WITHOUT a `configurePublishables` static", () => {
      const discovery = new DiscoveryStub([
        ModuleWithoutPublishables as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      // No error, no log — the loader simply moves on.
      expect(() => loader.onApplicationBootstrap()).not.toThrow();
      expect(registry.size()).toBe(0);
    });

    it("silently skips modules where `configurePublishables` is NOT a function", () => {
      const discovery = new DiscoveryStub([
        ModuleWithNonFunctionMember as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      // The duck-type check is `typeof fn === 'function'` — a
      // string static is silently ignored.
      expect(() => loader.onApplicationBootstrap()).not.toThrow();
      expect(registry.size()).toBe(0);
    });

    it("iterates in the order `getModules()` returns them", () => {
      const discovery = new DiscoveryStub([
        ModuleWithPublishables as unknown as Type<unknown>,
        ModuleWithMultiplePublishables as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      loader.onApplicationBootstrap();

      // Both modules registered — the order matches iteration.
      expect(registry.keys()).toEqual(["cfg-a", "multi-a", "multi-b"]);
    });

    it("empty getModules() — no-op, no error", () => {
      const discovery = new DiscoveryStub([]);
      const loader = new PublishableLoader(discovery, registry);
      expect(() => loader.onApplicationBootstrap()).not.toThrow();
      expect(registry.size()).toBe(0);
    });
  });

  describe("consumer construction", () => {
    it("hands a fresh `PublishableConsumer` to each module", () => {
      const discovery = new DiscoveryStub([
        ModuleWithPublishables as unknown as Type<unknown>,
        ModuleWithMultiplePublishables as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      loader.onApplicationBootstrap();

      // The spy captured the consumer passed to `ModuleWithPublishables`;
      // by direct instance check, it must be a real `PublishableConsumer`.
      const captured = ModuleWithPublishables.publishSpy.mock.calls[0]?.[0];
      expect(captured).toBeInstanceOf(PublishableConsumer);
    });

    it("attributes registered entries to the correct source module", () => {
      const discovery = new DiscoveryStub([
        ModuleWithPublishables as unknown as Type<unknown>,
        ModuleWithMultiplePublishables as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      loader.onApplicationBootstrap();

      // Each entry carries the correct sourceModule — critical for
      // error diagnostics when validation fails downstream.
      expect(registry.byTag("cfg-a")?.sourceModule).toBe(ModuleWithPublishables);
      expect(registry.byTag("multi-a")?.sourceModule).toBe(ModuleWithMultiplePublishables);
      expect(registry.byTag("multi-b")?.sourceModule).toBe(ModuleWithMultiplePublishables);
    });

    it("auto-fills packageRoot from each module's own PACKAGE_ROOT", () => {
      const discovery = new DiscoveryStub([
        ModuleWithPublishables as unknown as Type<unknown>,
        ModuleWithMultiplePublishables as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      loader.onApplicationBootstrap();

      // ModuleWithPublishables has PACKAGE_ROOT = '/abs/module-a'.
      expect(registry.byTag("cfg-a")?.packageRoot).toBe("/abs/module-a");
      // ModuleWithMultiplePublishables has PACKAGE_ROOT = '/abs/module-multi'.
      expect(registry.byTag("multi-a")?.packageRoot).toBe("/abs/module-multi");
      expect(registry.byTag("multi-b")?.packageRoot).toBe("/abs/module-multi");
    });
  });

  describe("this-binding", () => {
    it("preserves `this` inside `configurePublishables` so sibling statics still resolve", () => {
      const discovery = new DiscoveryStub([
        ModuleThatInspectsThis as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      loader.onApplicationBootstrap();

      // `.call(ModuleClass, consumer)` binds `this` to the class,
      // matching the natural static-call shape.
      expect(ModuleThatInspectsThis.seenThis.value).toBe(ModuleThatInspectsThis);
    });
  });

  describe("fail-loud on bad manifest", () => {
    it("propagates the validation error when a module's manifest is invalid", () => {
      // `ModuleThatThrowsInside` publishes an entry with a bad tag
      // (`not_kebab_case`). The registry throws inside the module's
      // `configurePublishables` — the loader must NOT swallow it.
      const discovery = new DiscoveryStub([
        ModuleThatThrowsInside as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      expect(() => loader.onApplicationBootstrap()).toThrow(/kebab-case/);
    });

    it("propagation includes duplicate errors when two modules claim the same tag", () => {
      // Module A registers `cfg-a`, Module B tries to register the
      // same tag. The loader hits the duplicate on Module B's turn
      // and the error propagates.
      class ModuleClaimA {
        public static readonly PACKAGE_ROOT = "/abs/mod-claim-a";
        public static configurePublishables(consumer: { publish: (e: unknown) => unknown }): void {
          consumer.publish({
            tag: "duped-tag",
            files: [{ from: "a.ts", to: "a.ts" }],
          });
        }
      }
      class ModuleClaimB {
        public static readonly PACKAGE_ROOT = "/abs/mod-claim-b";
        public static configurePublishables(consumer: { publish: (e: unknown) => unknown }): void {
          consumer.publish({
            tag: "duped-tag",
            files: [{ from: "b.ts", to: "b.ts" }],
          });
        }
      }
      const discovery = new DiscoveryStub([
        ModuleClaimA as unknown as Type<unknown>,
        ModuleClaimB as unknown as Type<unknown>,
      ]);
      const loader = new PublishableLoader(discovery, registry);
      expect(() => loader.onApplicationBootstrap()).toThrow(/already registered/);
    });
  });
});
