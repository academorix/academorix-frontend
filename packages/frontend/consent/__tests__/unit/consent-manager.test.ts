/**
 * @file consent-manager.test.ts
 * @module @stackra/consent/__tests__/unit
 * @description ConsentManager — consent reads/mutations, required invariants,
 *   and memory adapter persistence.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { ConsentManager } from "@/core/services/consent-manager.service";
import { ConsentRegistry } from "@/core/services/consent-registry.service";
import { MemoryConsentAdapter } from "@/core/adapters/memory-consent.adapter";
import type { IConsentCategory, IConsentModuleOptions } from "@/core/types";

const categories: IConsentCategory[] = [
  {
    slug: "necessary",
    label: "Necessary",
    description: "Essential",
    required: true,
    default: true,
  },
  { slug: "analytics", label: "Analytics", description: "Usage", required: false, default: false },
  {
    slug: "functional",
    label: "Functional",
    description: "Enhanced",
    required: false,
    default: true,
  },
];

function makeConfig(overrides: Partial<IConsentModuleOptions> = {}): IConsentModuleOptions {
  return { categories, emitEvents: false, ...overrides } as IConsentModuleOptions;
}

function makeRegistry(config: IConsentModuleOptions): ConsentRegistry {
  const registry = new ConsentRegistry(config);
  registry.onModuleInit();
  return registry;
}

describe("ConsentManager", () => {
  let adapter: MemoryConsentAdapter;
  let manager: ConsentManager;

  beforeEach(async () => {
    const config = makeConfig();
    adapter = new MemoryConsentAdapter();
    manager = new ConsentManager(makeRegistry(config), adapter, config);
    await manager.onApplicationBootstrap();
  });

  it("applies per-category defaults on bootstrap", () => {
    expect(manager.hasConsent("functional")).toBe(true);
    expect(manager.hasConsent("analytics")).toBe(false);
  });

  it("required categories are always granted", () => {
    expect(manager.hasConsent("necessary")).toBe(true);
    manager.revokeConsent("necessary"); // no-op
    expect(manager.hasConsent("necessary")).toBe(true);
  });

  it("grants and revokes a single category", () => {
    manager.grantConsent("analytics");
    expect(manager.hasConsent("analytics")).toBe(true);
    manager.revokeConsent("analytics");
    expect(manager.hasConsent("analytics")).toBe(false);
  });

  it("grantAll / revokeAll affect only non-required categories", () => {
    manager.grantAll();
    expect(manager.hasConsent("analytics")).toBe(true);
    expect(manager.hasConsent("functional")).toBe(true);

    manager.revokeAll();
    expect(manager.hasConsent("analytics")).toBe(false);
    expect(manager.hasConsent("functional")).toBe(false);
    expect(manager.hasConsent("necessary")).toBe(true);
  });

  it("marks decided after an explicit action", () => {
    expect(manager.isDecided()).toBe(false);
    manager.grantConsent("analytics");
    expect(manager.isDecided()).toBe(true);
  });

  it("persists preferences to the memory adapter", async () => {
    manager.grantConsent("analytics");
    const stored = await adapter.load();
    expect(stored?.analytics).toBe(true);
  });

  it("rehydrates persisted preferences into a fresh manager", async () => {
    manager.grantConsent("analytics");

    const config = makeConfig();
    const revived = new ConsentManager(makeRegistry(config), adapter, config);
    await revived.onApplicationBootstrap();

    expect(revived.isDecided()).toBe(true);
    expect(revived.hasConsent("analytics")).toBe(true);
  });
});
