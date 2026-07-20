/**
 * @file agent.registry.test.ts
 * @description Unit tests for {@link AgentRegistry} — config seeding on
 *   OnModuleInit + direct registration + change notification.
 */

import { describe, expect, it, vi } from "vitest";
import type { IAiConfig, IPersona } from "@stackra/contracts";

import { AgentRegistry } from "@/core/registries/agent.registry";

const persona = (slug: string, title = slug): IPersona => ({ slug, title });

function makeRegistry(personas?: IPersona[]): AgentRegistry {
  const config: IAiConfig = {
    baseUrl: "https://x",
    authProvider: {
      getCredentials: () => Promise.resolve({}),
      refresh: () => Promise.resolve({}),
    },
    ...(personas !== undefined ? { personas } : {}),
  };
  const registry = new AgentRegistry(config);
  registry.onModuleInit();
  return registry;
}

describe("AgentRegistry", () => {
  it("seeds config-declared personas on onModuleInit (Req 14.2)", () => {
    const registry = makeRegistry([persona("writer"), persona("analyst")]);
    expect(registry.count()).toBe(2);
    expect(registry.get("writer")).toEqual({ slug: "writer", title: "writer" });
    expect(registry.get("analyst")).toEqual({ slug: "analyst", title: "analyst" });
  });

  it("starts empty when config omits personas", () => {
    const registry = makeRegistry([]);
    expect(registry.count()).toBe(0);
  });

  it("starts empty when no config is injected at all", () => {
    const registry = new AgentRegistry();
    registry.onModuleInit();
    expect(registry.count()).toBe(0);
  });

  it("register adds a persona and notifies listeners", () => {
    const registry = makeRegistry([]);
    const listener = vi.fn();
    registry.onChange(listener);
    registry.register(persona("coach"));
    expect(registry.has("coach")).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("ignores personas without a slug", () => {
    const registry = makeRegistry([]);
    registry.register({ slug: "", title: "nope" });
    expect(registry.count()).toBe(0);
  });

  it("replaces an existing persona with the same slug (last-wins)", () => {
    const registry = makeRegistry([]);
    registry.register({ slug: "w", title: "A" });
    registry.register({ slug: "w", title: "B" });
    expect(registry.get("w")?.title).toBe("B");
    expect(registry.count()).toBe(1);
  });

  it("all() snapshots every persona", () => {
    const registry = makeRegistry([persona("a"), persona("b"), persona("c")]);
    expect(
      registry
        .all()
        .map((p) => p.slug)
        .sort(),
    ).toEqual(["a", "b", "c"]);
  });
});
