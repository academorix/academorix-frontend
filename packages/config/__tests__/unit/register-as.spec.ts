/**
 * @file register-as.spec.ts
 * @module @stackra/config/tests
 * @description Unit tests for `registerAs` — the tagged-factory
 *   helper. Covers `.KEY` presence + non-enumerability, `.asProvider()`
 *   shape, namespace metadata, and identity of the KEY across calls
 *   with the same namespace.
 */

import { describe, expect, it } from "vitest";

import { getConfigToken, registerAs } from "@/core";

describe("registerAs", () => {
  it("returns the same factory reference (identity)", () => {
    const factory = (): { port: number } => ({ port: 3000 });
    const registered = registerAs("test-identity", factory);
    // Identity check — `registerAs` decorates in place, not clone.
    expect(registered).toBe(factory);
  });

  it("stamps a non-enumerable `.KEY` property matching getConfigToken", () => {
    const factory = registerAs("cache", () => ({ ttl: 3600 }));
    expect(factory.KEY).toBe(getConfigToken("cache"));
    // Should not appear in `Object.keys` — matches nestjs's
    // non-enumerable stamp behaviour.
    expect(Object.keys(factory)).not.toContain("KEY");
  });

  it("stamps a non-writable `.KEY` property", () => {
    const factory = registerAs("immutable", () => ({}));
    const descriptor = Object.getOwnPropertyDescriptor(factory, "KEY");
    expect(descriptor?.writable).toBe(false);
    expect(descriptor?.configurable).toBe(false);
    expect(descriptor?.enumerable).toBe(false);
  });

  it(".asProvider() returns { imports, useFactory, inject } shape", () => {
    const factory = registerAs("provider-shape", () => ({ x: 1 }));
    const provider = factory.asProvider();
    expect(Array.isArray(provider.imports)).toBe(true);
    expect(provider.imports).toHaveLength(1);
    expect(typeof provider.useFactory).toBe("function");
    expect(provider.inject).toEqual([getConfigToken("provider-shape")]);
  });

  it(".asProvider().useFactory is identity — returns its argument", () => {
    const factory = registerAs("identity-factory", () => ({ y: 2 }));
    const provider = factory.asProvider();
    const cfg = { y: 42 };
    expect(provider.useFactory(cfg)).toBe(cfg);
  });

  it("produces the same .KEY for two registrations of the same namespace", () => {
    const first = registerAs("same-key", () => ({}));
    const second = registerAs("same-key", () => ({}));
    // Same namespace → same derived KEY (string equality).
    expect(first.KEY).toBe(second.KEY);
  });

  it("exposes the raw namespace via a public `.namespace` property (Stackra addition)", () => {
    const factory = registerAs("meta", () => ({}));
    // `namespace` is a Stackra addition — nestjs doesn't expose it.
    expect((factory as unknown as { namespace: string }).namespace).toBe("meta");
  });

  it("exposes namespace as string when constructed from a symbol", () => {
    const sym = Symbol("symbol-namespace");
    const factory = registerAs(sym, () => ({}));
    // Symbol namespaces expose their .description.
    expect((factory as unknown as { namespace: string }).namespace).toBe("symbol-namespace");
  });
});
