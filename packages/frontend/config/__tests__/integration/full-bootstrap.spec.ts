/**
 * @file full-bootstrap.spec.ts
 * @module @stackra/config/tests
 * @description Integration test — bootstraps a real
 *   `ApplicationFactory.create(TestModule)` with `ConfigModule.forRoot({
 *   load: [testConfig1, testConfig2] })`, then asserts:
 *   - `ConfigService.get('test1.value')` returns the factory-produced value.
 *   - `@Inject(testConfig1.KEY)` resolves the config in a downstream provider.
 *   - `testConfig1.asProvider()` has the expected `{ imports, useFactory, inject }` shape.
 *   - `ConfigModule.envVariablesLoaded` resolves after bootstrap.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApplicationFactory, Inject, Injectable, Module } from "@stackra/container";
import { describe, expect, it } from "vitest";

import { ConfigModule, ConfigService, registerAs } from "@/core";

// Two config factories with distinct namespaces — the integration
// spec exercises both single and multi-factory routing through the
// CONFIGURATION_LOADER seed loader.
const testConfig1 = registerAs("test1", () => ({ value: "from-test1", nested: { key: 42 } }));
const testConfig2 = registerAs("test2", () => ({ port: 3000, debug: true }));

/**
 * Downstream provider that injects `testConfig1.KEY` to prove the
 * `.asProvider()` wiring works end-to-end.
 */
@Injectable()
class ConfigConsumer {
  public constructor(
    @Inject(testConfig1.KEY) public readonly cfg1: { value: string; nested: { key: number } },
  ) {}
}

@Module({
  imports: [
    // Late import — the module-metadata reader accepts Promise<DynamicModule>.
    ConfigModule.forRoot({ isGlobal: true, load: [testConfig1, testConfig2] }),
  ],
  providers: [ConfigConsumer],
  exports: [ConfigConsumer],
})
class TestModule {}

describe("Full-bootstrap integration", () => {
  it(".asProvider() returns the expected shape", () => {
    const provider = testConfig1.asProvider();
    expect(provider.imports).toHaveLength(1);
    expect(typeof provider.useFactory).toBe("function");
    expect(provider.inject).toEqual([testConfig1.KEY]);
  });

  it("bootstraps the module tree and resolves ConfigService", async () => {
    const app = await ApplicationFactory.create(TestModule);
    const configService = app.get(ConfigService);
    expect(configService).toBeInstanceOf(ConfigService);
  });

  it("ConfigService.get() reaches values from a namespaced factory", async () => {
    const app = await ApplicationFactory.create(TestModule);
    const configService = app.get(ConfigService);
    // Values are stored under the namespace slot: `test1.value` /
    // `test2.port`.
    expect(configService.get("test1.value")).toBe("from-test1");
    expect(configService.get("test1.nested.key")).toBe(42);
    expect(configService.get("test2.port")).toBe(3000);
    expect(configService.get("test2.debug")).toBe(true);
  });

  it("@Inject(cfg.KEY) resolves the factory-produced config", async () => {
    const app = await ApplicationFactory.create(TestModule);
    const consumer = app.get(ConfigConsumer);
    expect(consumer.cfg1).toEqual({ value: "from-test1", nested: { key: 42 } });
  });

  it("envVariablesLoaded resolves after bootstrap", async () => {
    await ApplicationFactory.create(TestModule);
    // Awaiting an already-resolved promise is synchronous — if the
    // signal never fired, this would hang forever.
    await expect(ConfigModule.envVariablesLoaded).resolves.toBeUndefined();
  });
});
