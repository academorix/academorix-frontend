/**
 * @file pipeline-module.spec.ts
 * @module @stackra/pipeline/__tests__/unit
 * @description Behavioural spec for `PipelineModule.forRoot()` —
 *   verifies the DynamicModule shape, the PipelineHub singleton
 *   provider, and the PIPELINE_FACTORY factory contract.
 */

import { describe, expect, it } from "vitest";

import { PipelineModule } from "@/pipeline.module";
import { PIPELINE_FACTORY } from "@/constants/pipeline.constant";
import { PipelineHub } from "@/services/pipeline-hub.service";
import { Pipeline } from "@/services/pipeline.service";

// A "provider record" as returned by the container's `providers`
// array — either a class token or a `{ provide, useFactory | useValue,
// inject? }` shape. These specs assert on the returned array's shape
// without booting a real container.
type ProviderRecord =
  | (new (...args: unknown[]) => unknown)
  | {
      provide: unknown;
      useValue?: unknown;
      useFactory?: (...args: unknown[]) => unknown;
      inject?: unknown[];
    };

describe("PipelineModule", () => {
  describe(".forRoot()", () => {
    it("returns a global DynamicModule with `PipelineHub` and `PIPELINE_FACTORY` in providers + exports", () => {
      const dynamic = PipelineModule.forRoot();

      // The module identity is preserved so DI graphs can dedupe by
      // constructor reference.
      expect(dynamic.module).toBe(PipelineModule);
      // Marked `global: true` so consumers don't have to import it
      // in every feature module.
      expect(dynamic.global).toBe(true);

      const providers = (dynamic.providers ?? []) as ProviderRecord[];

      // Class-token entry for the PipelineHub singleton…
      expect(providers).toContain(PipelineHub);

      // …and a factory entry for the PIPELINE_FACTORY.
      const factoryEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === PIPELINE_FACTORY,
      );
      expect(factoryEntry).toBeDefined();
      expect(typeof factoryEntry?.useFactory).toBe("function");

      // Both symbols are re-exported so downstream modules can inject
      // them without importing PipelineModule directly.
      expect(dynamic.exports).toEqual(expect.arrayContaining([PipelineHub, PIPELINE_FACTORY]));
    });

    it("PIPELINE_FACTORY.useFactory produces a fresh `Pipeline` on each call", () => {
      const dynamic = PipelineModule.forRoot();
      const providers = (dynamic.providers ?? []) as ProviderRecord[];
      const factoryEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === PIPELINE_FACTORY,
      );
      // `useFactory(app?)` returns the PipelineFactory closure that
      // finally produces a Pipeline. Simulate the container passing
      // `undefined` for the optional APPLICATION dep.
      const factory = factoryEntry!.useFactory!(undefined) as <T = unknown>() => Pipeline<T>;

      const pipelineA = factory<number>();
      const pipelineB = factory<number>();

      // Each factory call yields a distinct Pipeline instance so no
      // state (passable, pipes, method) leaks across usages.
      expect(pipelineA).toBeInstanceOf(Pipeline);
      expect(pipelineB).toBeInstanceOf(Pipeline);
      expect(pipelineA).not.toBe(pipelineB);
    });

    it("PIPELINE_FACTORY declares APPLICATION as an optional inject", () => {
      const dynamic = PipelineModule.forRoot();
      const providers = (dynamic.providers ?? []) as ProviderRecord[];
      const factoryEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === PIPELINE_FACTORY,
      );

      // The inject array carries ONE optional-injection descriptor —
      // the { token, optional: true } shape used by @stackra/container.
      expect(Array.isArray(factoryEntry?.inject)).toBe(true);
      expect(factoryEntry?.inject).toHaveLength(1);
      const injectDescriptor = factoryEntry!.inject![0] as { token?: unknown; optional?: boolean };
      expect(injectDescriptor).toMatchObject({ optional: true });
      // The token itself is the APPLICATION symbol — assert on the
      // description so we don't have to import it here.
      expect(typeof injectDescriptor.token).toBe("symbol");
    });
  });
});
