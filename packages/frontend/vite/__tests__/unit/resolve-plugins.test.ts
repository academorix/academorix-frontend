/**
 * @file resolve-plugins.test.ts
 * @module @stackra/vite/test/unit
 * @description Unit tests for `resolvePlugins(...)` — enabled
 *   gating, sync and async factories, plugin array flattening,
 *   ordering, and error wrapping into
 *   {@link PluginResolutionError}.
 */

import { describe, expect, it } from "vitest";
import type { Plugin } from "vite";
import { PluginResolutionError } from "@/core/errors/plugin-resolution.error";
import { ViteConfigError } from "@/core/errors/vite-config.error";
import type { IPluginMap } from "@/core/interfaces/plugin-map.interface";
import { resolvePlugins } from "@/core/utils/resolve-plugins.util";

/**
 * Build a minimal fake `Plugin` — Vite only requires a `name`
 * property at the type level, so tests never need to pull in a
 * real plugin package.
 *
 * @param name - Debug name.
 * @returns A fake plugin object typed as `Plugin`.
 */
function fakePlugin(name: string): Plugin {
  return { name };
}

describe("resolvePlugins", () => {
  it("returns an empty array when the map is undefined", async () => {
    const plugins = await resolvePlugins(undefined);
    expect(plugins).toEqual([]);
  });

  it("returns an empty array when the map is empty", async () => {
    const plugins = await resolvePlugins({});
    expect(plugins).toEqual([]);
  });

  it("skips entries where enabled is false", async () => {
    const map: IPluginMap = {
      off: {
        enabled: false,
        factory: () => {
          throw new Error("should never be called");
        },
        options: {},
      },
      on: {
        enabled: true,
        factory: () => fakePlugin("on"),
        options: {},
      },
    };

    const plugins = await resolvePlugins(map);

    expect(plugins).toHaveLength(1);
    expect(plugins[0]?.name).toBe("on");
  });

  it("invokes sync factories returning a single Plugin", async () => {
    const map: IPluginMap = {
      single: {
        enabled: true,
        factory: () => fakePlugin("single"),
        options: {},
      },
    };

    const plugins = await resolvePlugins(map);

    expect(plugins).toEqual([{ name: "single" }]);
  });

  it("flattens sync factories returning Plugin[]", async () => {
    const map: IPluginMap = {
      multi: {
        enabled: true,
        factory: () => [fakePlugin("a"), fakePlugin("b"), fakePlugin("c")],
        options: {},
      },
    };

    const plugins = await resolvePlugins(map);

    expect(plugins.map((p) => p.name)).toEqual(["a", "b", "c"]);
  });

  it("awaits async factories", async () => {
    const map: IPluginMap = {
      lazy: {
        enabled: true,
        factory: async () => {
          await new Promise((r) => setTimeout(r, 5));
          return fakePlugin("lazy");
        },
        options: {},
      },
    };

    const plugins = await resolvePlugins(map);

    expect(plugins).toEqual([{ name: "lazy" }]);
  });

  it("awaits async factories returning Plugin[]", async () => {
    const map: IPluginMap = {
      lazyMulti: {
        enabled: true,
        factory: async () => [fakePlugin("x"), fakePlugin("y")],
        options: {},
      },
    };

    const plugins = await resolvePlugins(map);

    expect(plugins.map((p) => p.name)).toEqual(["x", "y"]);
  });

  it("forwards options verbatim to the factory", async () => {
    const captured: unknown[] = [];
    const map: IPluginMap = {
      spy: {
        enabled: true,
        factory: (opts: { flag: boolean; label: string }) => {
          captured.push(opts);
          return fakePlugin(opts.label);
        },
        options: { flag: true, label: "spied" },
      },
    };

    const plugins = await resolvePlugins(map);

    expect(captured).toEqual([{ flag: true, label: "spied" }]);
    expect(plugins[0]?.name).toBe("spied");
  });

  it("preserves insertion order of the map keys", async () => {
    const map: IPluginMap = {
      first: { enabled: true, factory: () => fakePlugin("first"), options: {} },
      second: { enabled: true, factory: () => fakePlugin("second"), options: {} },
      third: { enabled: true, factory: () => fakePlugin("third"), options: {} },
    };

    const plugins = await resolvePlugins(map);

    expect(plugins.map((p) => p.name)).toEqual(["first", "second", "third"]);
  });

  it("wraps a throwing factory into PluginResolutionError with the original as cause", async () => {
    const boom = new Error("boom");
    const map: IPluginMap = {
      broken: {
        enabled: true,
        factory: () => {
          throw boom;
        },
        options: {},
      },
    };

    await expect(resolvePlugins(map)).rejects.toMatchObject({
      name: "PluginResolutionError",
      code: "VITE_CONFIG_PLUGIN_RESOLUTION",
    });

    try {
      await resolvePlugins(map);
    } catch (err) {
      expect(err).toBeInstanceOf(PluginResolutionError);
      expect(err).toBeInstanceOf(ViteConfigError);
      expect((err as PluginResolutionError).cause).toBe(boom);
      expect((err as PluginResolutionError).message).toContain("broken");
      expect((err as PluginResolutionError).message).toContain("boom");
    }
  });

  it("wraps a rejecting async factory into PluginResolutionError", async () => {
    const map: IPluginMap = {
      async_broken: {
        enabled: true,
        factory: async () => {
          throw new Error("async boom");
        },
        options: {},
      },
    };

    try {
      await resolvePlugins(map);
      throw new Error("expected resolvePlugins to reject");
    } catch (err) {
      expect(err).toBeInstanceOf(PluginResolutionError);
      expect((err as PluginResolutionError).message).toContain("async_broken");
    }
  });

  it("wraps a factory throwing a non-Error value into a PluginResolutionError with an Error cause", async () => {
    const map: IPluginMap = {
      stringy: {
        enabled: true,
        factory: () => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw "plain string";
        },
        options: {},
      },
    };

    try {
      await resolvePlugins(map);
      throw new Error("expected resolvePlugins to reject");
    } catch (err) {
      expect(err).toBeInstanceOf(PluginResolutionError);
      expect((err as PluginResolutionError).cause).toBeInstanceOf(Error);
      expect((err as PluginResolutionError).cause?.message).toBe("plain string");
    }
  });
});
