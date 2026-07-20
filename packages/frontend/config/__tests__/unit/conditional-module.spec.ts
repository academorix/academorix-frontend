/**
 * @file conditional-module.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `ConditionalModule.registerWhen(...)`.
 *   Both the env-var-name string form and the predicate form; the
 *   timeout branch is documented but not exercised here (would
 *   require a fresh module reload).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConditionalModule, ConfigModule } from "@/core";

// `ConfigModule.envVariablesLoaded` is class-static — resolving it
// once during the test suite means every subsequent
// `registerWhen(...)` call sees the resolved promise. We fire it
// eagerly here so the predicate path runs synchronously.
beforeEach(async () => {
  // Kick off forRoot at least once to resolve the promise.
  await ConfigModule.forRoot();
});

// Stub target modules for the conditional loader.
class LoadMeModule {}
class SkipMeModule {}

describe("ConditionalModule.registerWhen()", () => {
  afterEach(() => {
    delete process.env.COND_TEST_ON;
    delete process.env.COND_TEST_OFF;
  });

  it("loads the module when the env-string form evaluates truthy", async () => {
    process.env.COND_TEST_ON = "yes";
    const dynamic = await ConditionalModule.registerWhen(LoadMeModule, "COND_TEST_ON");
    expect(dynamic.imports).toContain(LoadMeModule);
    expect(dynamic.exports).toContain(LoadMeModule);
  });

  it("skips the module when the env-string form is explicitly `false`", async () => {
    process.env.COND_TEST_OFF = "false";
    const dynamic = await ConditionalModule.registerWhen(SkipMeModule, "COND_TEST_OFF", {
      debug: false,
    });
    expect(dynamic.imports).not.toContain(SkipMeModule);
    expect(dynamic.exports).not.toContain(SkipMeModule);
  });

  it("loads the module when the predicate form returns true", async () => {
    process.env.COND_PREDICATE = "anything";
    const dynamic = await ConditionalModule.registerWhen(LoadMeModule, (env) =>
      Boolean(env["COND_PREDICATE"]),
    );
    expect(dynamic.imports).toContain(LoadMeModule);
  });

  it("skips the module when the predicate form returns false", async () => {
    delete process.env.COND_MISSING;
    const dynamic = await ConditionalModule.registerWhen(
      SkipMeModule,
      (env) => Boolean(env["COND_MISSING"]),
      { debug: false },
    );
    expect(dynamic.imports).not.toContain(SkipMeModule);
  });

  it("returns a module with the ConditionalModule identity", async () => {
    const dynamic = await ConditionalModule.registerWhen(LoadMeModule, "ANY_KEY", {
      debug: false,
    });
    expect(dynamic.module).toBe(ConditionalModule);
  });
});
