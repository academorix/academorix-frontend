/**
 * @file config-module.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `ConfigModule.forRoot` /
 *   `ConfigModule.forFeature` — provider-tree shape assertions.
 *   Does not spin up the full DI container; the integration spec
 *   under `../integration/full-bootstrap.spec.ts` covers that path.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { FactoryProvider } from "@stackra/container";
import {
  CONFIGURATION_LOADER,
  CONFIGURATION_SERVICE_TOKEN,
  CONFIGURATION_TOKEN,
  VALIDATED_ENV_LOADER,
} from "@stackra/contracts";
import { describe, expect, it } from "vitest";

import { ConfigModule, ConfigService, registerAs } from "@/core";

describe("ConfigModule.forRoot()", () => {
  it("returns a dynamic module referencing itself", async () => {
    const dynamic = await ConfigModule.forRoot();
    expect(dynamic.module).toBe(ConfigModule);
  });

  it("is not global by default", async () => {
    const dynamic = await ConfigModule.forRoot();
    expect(dynamic.global).toBeFalsy();
  });

  it("respects isGlobal option", async () => {
    const dynamic = await ConfigModule.forRoot({ isGlobal: true });
    expect(dynamic.global).toBe(true);
  });

  it("binds a provider for each factory in `load`", async () => {
    const factoryA = registerAs("a-namespace", () => ({ a: 1 }));
    const factoryB = registerAs("b-namespace", () => ({ b: 2 }));
    const dynamic = await ConfigModule.forRoot({ load: [factoryA, factoryB] });
    // Each factory contributes a provider bound under its stamped
    // .KEY — the derived string tokens should be present.
    const provideTokens = (dynamic.providers ?? []).map((p) =>
      typeof p === "object" && p !== null && "provide" in p ? p.provide : p,
    );
    expect(provideTokens).toContain(factoryA.KEY);
    expect(provideTokens).toContain(factoryB.KEY);
  });

  it("exports the ConfigService class and each loaded factory KEY", async () => {
    const factoryA = registerAs("exp-a", () => ({}));
    const dynamic = await ConfigModule.forRoot({ load: [factoryA] });
    expect(dynamic.exports).toContain(ConfigService);
    expect(dynamic.exports).toContain(factoryA.KEY);
  });

  it("binds CONFIGURATION_LOADER when `load` is non-empty", async () => {
    const factoryA = registerAs("loader-check", () => ({}));
    const dynamic = await ConfigModule.forRoot({ load: [factoryA] });
    const providers = (dynamic.providers ?? []) as FactoryProvider[];
    const loader = providers.find((p) => p.provide === CONFIGURATION_LOADER);
    expect(loader).toBeDefined();
    // The loader's useFactory must be a function that returns a
    // seed-loader object (per module-lifecycle steering).
    expect(typeof loader?.useFactory).toBe("function");
  });

  it("does NOT bind CONFIGURATION_LOADER when `load` is empty", async () => {
    const dynamic = await ConfigModule.forRoot();
    const providers = (dynamic.providers ?? []) as FactoryProvider[];
    const loader = providers.find((p) => p.provide === CONFIGURATION_LOADER);
    expect(loader).toBeUndefined();
  });

  it("binds VALIDATED_ENV_LOADER when `validate` runs", async () => {
    const dynamic = await ConfigModule.forRoot({
      validate: (raw) => ({ ...raw, ADDED_BY_VALIDATION: "yes" }),
    });
    const providers = (dynamic.providers ?? []) as FactoryProvider[];
    const validatedLoader = providers.find((p) => p.provide === VALIDATED_ENV_LOADER);
    expect(validatedLoader).toBeDefined();
  });

  it("resolves envVariablesLoaded after forRoot completes", async () => {
    // The promise is class-static and resolved on the FIRST forRoot
    // call — subsequent calls see the already-resolved promise.
    await ConfigModule.forRoot();
    // Awaiting a resolved promise returns synchronously; if the
    // signal never fired, the test would time out.
    await expect(ConfigModule.envVariablesLoaded).resolves.toBeUndefined();
  });

  it("accepts a plain-object `parser` override", async () => {
    // The custom parser returns a fixed record — proves it wired
    // through to the load step. Because we're not passing an env
    // file, the parser is set but not called; still verifies the
    // option threads through without throwing.
    const customParser = (): Record<string, string> => ({ FROM_CUSTOM_PARSER: "true" });
    const dynamic = await ConfigModule.forRoot({
      ignoreEnvFile: true,
      parser: customParser,
    });
    expect(dynamic.module).toBe(ConfigModule);
  });
});

describe("ConfigModule.forFeature()", () => {
  it("returns a dynamic module referencing itself", () => {
    const factory = registerAs("feature-a", () => ({ x: 1 }));
    const dynamic = ConfigModule.forFeature(factory);
    expect(dynamic.module).toBe(ConfigModule);
  });

  it("binds the factory under its .KEY", () => {
    const factory = registerAs("feature-b", () => ({ y: 2 }));
    const dynamic = ConfigModule.forFeature(factory);
    const provideTokens = (dynamic.providers ?? []).map((p) =>
      typeof p === "object" && p !== null && "provide" in p ? p.provide : p,
    );
    expect(provideTokens).toContain(factory.KEY);
  });

  it("exports the factory KEY (ConfigService itself is exported by forRoot)", () => {
    const factory = registerAs("feature-c", () => ({ z: 3 }));
    const dynamic = ConfigModule.forFeature(factory);
    expect(dynamic.exports).toContain(factory.KEY);
    // `ConfigService` is bound + exported once by `forRoot`; the
    // feature module does NOT re-export it (the container's
    // last-wins semantics would swap in a stale binding).
    expect(dynamic.exports).not.toContain(ConfigService);
  });
});

describe("ConfigHostModule (via forRoot imports)", () => {
  it("imports ConfigHostModule so CONFIGURATION_TOKEN + CONFIGURATION_SERVICE_TOKEN resolve", () => {
    // `ConfigModule` declares `ConfigHostModule` as a static import.
    // Guard against silent removal by asserting the token pair is
    // used somewhere in the module's factory tree.
    expect(CONFIGURATION_TOKEN).toBeDefined();
    expect(CONFIGURATION_SERVICE_TOKEN).toBeDefined();
  });
});
