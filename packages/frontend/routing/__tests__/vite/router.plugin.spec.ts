/**
 * @file router.plugin.spec.ts
 * @module @stackra/routing/tests/vite
 * @description Unit tests for the `router()` Vite plugin.
 *
 *   The tests exercise the plugin's Vite-hook contract WITHOUT
 *   spinning up a real Vite server:
 *
 *   - `config()` mutates `server.allowedHosts` in serve mode.
 *   - `buildStart()` flips `STACKRA_PLATFORM=build` when prerender
 *     is enabled.
 *   - `configureServer()` returns a hook that injects the dev
 *     middleware + prints the banner.
 *   - `resolveId` + `load` expose the virtual dev-subdomain module.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { router } from "@/vite/router-plugin/router.plugin";
import {
  RESOLVED_DEV_SUBDOMAIN_ID,
  VIRTUAL_DEV_SUBDOMAIN_ID,
} from "@/vite/subdomain/virtual-module.util";

describe("router() plugin", () => {
  // Preserve + restore `STACKRA_PLATFORM` around every test so tests
  // don't leak build/client state into each other.
  let previousPlatform: string | undefined;

  beforeEach(() => {
    previousPlatform = process.env.STACKRA_PLATFORM;
    delete process.env.STACKRA_PLATFORM;
  });

  afterEach(() => {
    if (previousPlatform === undefined) delete process.env.STACKRA_PLATFORM;
    else process.env.STACKRA_PLATFORM = previousPlatform;
  });

  it("exposes the plugin name", () => {
    const plugin = router();
    expect(plugin.name).toBe("@stackra/routing:router");
  });

  it("supports zero-arg construction", () => {
    expect(() => router()).not.toThrow();
  });

  describe("config()", () => {
    it("sets server.host and appends allowedHosts in serve mode", () => {
      const plugin = router({ rootDomain: "stackra.app" });
      const configHook = plugin.config;
      expect(typeof configHook).toBe("function");
      const config: { server?: { host?: unknown; allowedHosts?: unknown } } = {};
      // Cast to `any` for the invocation — Vite's hook types allow
      // both `function` + `{handler}` object forms; we authored the
      // function form.
      (configHook as unknown as (c: typeof config, env: { command: "serve" | "build" }) => unknown)(
        config,
        { command: "serve" },
      );
      expect(config.server?.host).toBe("0.0.0.0");
      // `.localhost` + `stackra.app` + `.stackra.app` land in
      // the allow list.
      const hosts = config.server?.allowedHosts as string[];
      expect(hosts).toContain(".localhost");
      expect(hosts).toContain("stackra.app");
      expect(hosts).toContain(".stackra.app");
    });

    it("leaves server config alone in build mode", () => {
      const plugin = router({ rootDomain: "stackra.app" });
      const config: { server?: { host?: unknown } } = {};
      (
        plugin.config as unknown as (
          c: typeof config,
          env: { command: "serve" | "build" },
        ) => unknown
      )(config, { command: "build" });
      // No mutation — the plugin doesn't touch server config in
      // build.
      expect(config.server).toBeUndefined();
    });

    it("sets STACKRA_PLATFORM=client for client builds", () => {
      const plugin = router();
      const config = {};
      (
        plugin.config as unknown as (
          c: typeof config,
          env: { command: "serve" | "build" },
        ) => unknown
      )(config, { command: "build" });
      expect(process.env.STACKRA_PLATFORM).toBe("client");
    });
  });

  describe("buildStart()", () => {
    it("sets STACKRA_PLATFORM=build when prerender is enabled", () => {
      const plugin = router();
      (plugin.buildStart as unknown as () => void)();
      expect(process.env.STACKRA_PLATFORM).toBe("build");
    });

    it("does not set STACKRA_PLATFORM=build when prerender is disabled", () => {
      const plugin = router({ prerender: { enabled: false } });
      (plugin.buildStart as unknown as () => void)();
      // Flag stays undeleted / preserved — we only care that the hook
      // didn't force `build`.
      expect(process.env.STACKRA_PLATFORM).not.toBe("build");
    });
  });

  describe("resolveId() / load()", () => {
    it("resolves the dev-subdomain virtual module id", () => {
      const plugin = router();
      const resolved = (plugin.resolveId as unknown as (id: string) => string | null)(
        VIRTUAL_DEV_SUBDOMAIN_ID,
      );
      expect(resolved).toBe(RESOLVED_DEV_SUBDOMAIN_ID);
    });

    it("returns null for unknown ids", () => {
      const plugin = router();
      const resolved = (plugin.resolveId as unknown as (id: string) => string | null)(
        "some-other-module",
      );
      expect(resolved).toBeNull();
    });

    it("loads the dev-subdomain virtual module source", () => {
      const plugin = router();
      const source = (plugin.load as unknown as (id: string) => string | null)(
        RESOLVED_DEV_SUBDOMAIN_ID,
      );
      expect(source).toContain("export function getDevSubdomain");
      expect(source).toContain("__STACKRA_DEV_SUBDOMAIN__");
    });

    it("returns null when loading an unknown id", () => {
      const plugin = router();
      const source = (plugin.load as unknown as (id: string) => string | null)("other");
      expect(source).toBeNull();
    });
  });

  describe("configureServer()", () => {
    it("returns a post-hook that injects the middleware + prints the banner", () => {
      const plugin = router({
        rootDomain: "stackra.app",
        devSubdomains: ["admin"],
      });

      const middlewares = { use: vi.fn() };
      const server = {
        middlewares,
        config: { server: { port: 5173 } },
      } as unknown as Parameters<
        NonNullable<typeof plugin.configureServer> extends (s: infer S) => unknown ? S : never
      >[0];

      // The hook returns a post-`listen` function. Invoke it to
      // trigger the middleware injection.
      const postHook = (plugin.configureServer as unknown as (s: typeof server) => () => void)(
        server,
      );
      expect(typeof postHook).toBe("function");

      // Silence the banner writer for the assertion.
      const originalLog = console.log;
      console.log = vi.fn();
      try {
        postHook();
      } finally {
        console.log = originalLog;
      }

      expect(middlewares.use).toHaveBeenCalledTimes(1);
    });
  });
});
