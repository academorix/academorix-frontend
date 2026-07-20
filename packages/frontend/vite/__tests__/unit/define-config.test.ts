/**
 * @file define-config.test.ts
 * @module @stackra/vite/test/unit
 * @description Unit tests for `defineConfig(...)` — return-type
 *   shape, default merging, user overrides winning on conflict,
 *   and plugin-map resolution.
 */

import { describe, expect, it } from "vitest";
import type { ConfigEnv, Plugin } from "vite";
import { DEFAULT_VITE_CONFIG } from "@/core/constants/default-vite-config.constant";
import type { IPluginMap } from "@/core/interfaces/plugin-map.interface";
import { defineConfig } from "@/core/utils/define-config.util";

/** A `ConfigEnv` object suitable for feeding into the returned factory. */
const DEV_ENV: ConfigEnv = { mode: "development", command: "serve" };

/**
 * Build a fake `Plugin` — Vite only requires the `name` property at
 * the type level.
 *
 * @param name - Debug name.
 * @returns A fake plugin typed as `Plugin`.
 */
function fakePlugin(name: string): Plugin {
  return { name };
}

describe("defineConfig", () => {
  it("returns a function that accepts a ConfigEnv and produces a UserConfig", async () => {
    const factory = defineConfig();
    expect(typeof factory).toBe("function");

    const result = await factory(DEV_ENV);
    expect(result).toBeTypeOf("object");
    expect(result).not.toBeNull();
  });

  it("applies DEFAULT_VITE_CONFIG when the caller passes no options", async () => {
    const config = await defineConfig()(DEV_ENV);

    expect(config.envPrefix).toBe(DEFAULT_VITE_CONFIG.envPrefix);
    expect(config.esbuild).toEqual(DEFAULT_VITE_CONFIG.esbuild);
  });

  it("lets user overrides win over defaults (envPrefix)", async () => {
    const config = await defineConfig({ envPrefix: "APP_" })(DEV_ENV);

    expect(config.envPrefix).toBe("APP_");
  });

  it("merges server + build overrides on top of defaults", async () => {
    const config = await defineConfig({
      server: { port: 3000, host: "localhost" },
      build: { target: "es2022" },
    })(DEV_ENV);

    expect(config.server).toEqual({ port: 3000, host: "localhost" });
    expect(config.build).toEqual({ target: "es2022" });
    // Defaults are still present alongside the overrides.
    expect(config.envPrefix).toBe("VITE_");
  });

  it("resolves the plugin map into a Plugin[] array on the returned config", async () => {
    const plugins: IPluginMap = {
      alpha: { enabled: true, factory: () => fakePlugin("alpha"), options: {} },
      beta: { enabled: true, factory: () => fakePlugin("beta"), options: {} },
    };

    const config = await defineConfig({ plugins })(DEV_ENV);

    expect(Array.isArray(config.plugins)).toBe(true);
    expect((config.plugins as Plugin[]).map((p) => p.name)).toEqual(["alpha", "beta"]);
  });

  it("skips disabled entries when resolving the plugin map", async () => {
    const plugins: IPluginMap = {
      on: { enabled: true, factory: () => fakePlugin("on"), options: {} },
      off: {
        enabled: false,
        factory: () => {
          throw new Error("never");
        },
        options: {},
      },
    };

    const config = await defineConfig({ plugins })(DEV_ENV);

    expect((config.plugins as Plugin[]).map((p) => p.name)).toEqual(["on"]);
  });

  it("emits an empty plugins array when no plugin map is provided", async () => {
    const config = await defineConfig({})(DEV_ENV);

    expect(config.plugins).toEqual([]);
  });

  it("does not carry the raw plugin map through to the merged UserConfig", async () => {
    const plugins: IPluginMap = {
      alpha: { enabled: true, factory: () => fakePlugin("alpha"), options: {} },
    };

    const config = await defineConfig({ plugins })(DEV_ENV);

    // The `plugins` field must be an array of plugin instances,
    // never the raw envelope map — that would break Vite.
    expect(Array.isArray(config.plugins)).toBe(true);
    for (const p of config.plugins as Plugin[]) {
      expect(p).toHaveProperty("name");
      expect(p).not.toHaveProperty("enabled");
      expect(p).not.toHaveProperty("factory");
      expect(p).not.toHaveProperty("options");
    }
  });

  it("deep-merges nested esbuild override with the default tsconfigRaw", async () => {
    // The default sets `esbuild.tsconfigRaw.compilerOptions.experimentalDecorators`.
    // A caller override on a sibling field must not wipe the defaults.
    const config = await defineConfig({
      esbuild: { legalComments: "none" },
    })(DEV_ENV);

    expect(config.esbuild).toMatchObject({
      legalComments: "none",
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    });
  });
});
