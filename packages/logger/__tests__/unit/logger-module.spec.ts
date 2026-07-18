/**
 * @file logger-module.spec.ts
 * @module @stackra/logger/__tests__/unit
 * @description Behavioural spec for `LoggerModule.forRoot()` and
 *   `.forRootAsync()` — verifies the DynamicModule shape, provider
 *   bindings, and that the resolved config lands under the
 *   package-internal `LOGGER_CONFIG_INTERNAL` token (bound by the
 *   module for consumption only by services inside `@stackra/logger`).
 */

import { describe, expect, it, vi } from "vitest";

import { LOGGER_MANAGER, LogLevel } from "@stackra/contracts";

import { LOGGER_CONFIG_INTERNAL } from "@/core/constants/logger-config-internal.constant";
import { LoggerModule } from "@/core/logger.module";
import { LoggerManager } from "@/core/services/logger-manager.service";
import { ContextRepository } from "@/core/services/context-repository.service";
import { ConsoleReporter } from "@/core/reporters/console.reporter";
import { JsonReporter } from "@/core/reporters/json.reporter";
import { SilentReporter } from "@/core/reporters/silent.reporter";

// A provider record — either a class token, or a `{ provide, useValue |
// useFactory, inject? }` object. Enough to type-narrow provider array
// entries during assertions.
type ProviderRecord =
  | (new (...args: unknown[]) => unknown)
  | {
      provide: unknown;
      useValue?: unknown;
      useFactory?: (...args: unknown[]) => unknown;
      inject?: unknown[];
    };

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("LoggerModule", () => {
  describe(".forRoot()", () => {
    it("throws when called with no config (defaults live in the app-level factory now)", () => {
      // DEFAULT_LOGGER_CONFIG was removed in the @stackra/config migration —
      // the caller must supply a fully-formed config, or thread one in via
      // `.forRootAsync(loggerConfig.asProvider())`.
      // @ts-expect-error — intentionally passing undefined to trigger the guard.
      expect(() => LoggerModule.forRoot()).toThrow(/requires a config argument/);
    });

    it("returns a global DynamicModule bound to the LoggerModule class", () => {
      const dynamic = LoggerModule.forRoot({
        default: "console",
        channels: { console: { reporters: ["console"] } },
      });
      expect(dynamic.module).toBe(LoggerModule);
      // `global: true` allows every downstream module to inject
      // LOGGER_MANAGER without importing LoggerModule again.
      expect(dynamic.global).toBe(true);
    });

    it("registers the three built-in reporters, ContextRepository, and both LoggerManager tokens", () => {
      const dynamic = LoggerModule.forRoot({
        default: "console",
        channels: { console: { reporters: ["console"] } },
      });
      const providers = (dynamic.providers ?? []) as ProviderRecord[];

      // Class-token providers must include the built-in reporters +
      // the context repo.
      expect(providers).toContain(ConsoleReporter);
      expect(providers).toContain(JsonReporter);
      expect(providers).toContain(SilentReporter);
      expect(providers).toContain(ContextRepository);

      // Both the LoggerManager class token and the LOGGER_MANAGER
      // symbol alias must be bound.
      const managerFactory = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === LoggerManager,
      );
      const managerAlias = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === LOGGER_MANAGER,
      );
      expect(managerFactory).toBeDefined();
      expect(managerAlias).toBeDefined();
    });

    it("exports LOGGER_MANAGER, LoggerManager, and ContextRepository (LOGGER_CONFIG_INTERNAL is package-private)", () => {
      const dynamic = LoggerModule.forRoot({
        default: "console",
        channels: { console: { reporters: ["console"] } },
      });
      // These three are the symbols downstream modules inject
      // without importing LoggerModule directly.
      expect(dynamic.exports).toEqual(
        expect.arrayContaining([LOGGER_MANAGER, LoggerManager, ContextRepository]),
      );
      // LOGGER_CONFIG_INTERNAL must NOT leak — external modules read the
      // config via the app-owned `loggerConfig.KEY` on a @stackra/config
      // `registerAs` factory instead.
      expect(dynamic.exports).not.toContain(LOGGER_CONFIG_INTERNAL);
    });

    it("binds LOGGER_CONFIG_INTERNAL to the caller-supplied config `useValue`", () => {
      const dynamic = LoggerModule.forRoot({
        default: "console",
        channels: { console: { reporters: ["console"] } },
      });
      const providers = (dynamic.providers ?? []) as ProviderRecord[];
      const configEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === LOGGER_CONFIG_INTERNAL,
      );
      expect(configEntry).toBeDefined();
      // `useValue` is set to the caller's config, verbatim — env
      // overrides now run inside `LoggerManager.normalize()`, not
      // during binding.
      expect(configEntry!.useValue).toBeDefined();
      const configValue = configEntry!.useValue as { default: string };
      expect(configValue.default).toBe("console");
    });

    it("passes user overrides through to the resolved config verbatim", () => {
      const dynamic = LoggerModule.forRoot({
        default: "audit",
        channels: { audit: { reporters: ["json"] } },
      });
      const providers = (dynamic.providers ?? []) as ProviderRecord[];
      const configEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === LOGGER_CONFIG_INTERNAL,
      ) as Exclude<ProviderRecord, new (...args: unknown[]) => unknown>;

      const configValue = configEntry.useValue as {
        default: string;
        channels: Record<string, { reporters?: string[] }>;
      };
      expect(configValue.default).toBe("audit");
      expect(configValue.channels.audit).toEqual({ reporters: ["json"] });
    });

    it("LoggerManager useFactory wires enrichers and threads global context onto the manager", () => {
      // The factory used by `forRoot()` builds a LoggerManager, then
      // prepends an Interpolation enricher, adds Context + optionally
      // Redaction enrichers, and finally calls setGlobalContext. This
      // spec runs the factory in isolation to prove the wire-up.
      const dynamic = LoggerModule.forRoot({
        default: "app",
        channels: { app: {} },
        redact: { paths: ["password"] },
        globalContext: { service: "test" },
      });
      const providers = (dynamic.providers ?? []) as ProviderRecord[];
      const managerEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === LoggerManager,
      );
      expect(managerEntry?.useFactory).toBeDefined();

      // Provide the same deps the container would inject.
      const config = (
        providers.find(
          (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
            typeof p === "object" && "provide" in p && p.provide === LOGGER_CONFIG_INTERNAL,
        ) as Exclude<ProviderRecord, new (...args: unknown[]) => unknown>
      ).useValue;
      const contextRepo = new ContextRepository();

      const manager = managerEntry!.useFactory!(config, contextRepo) as LoggerManager;

      // The factory returned a real LoggerManager…
      expect(manager).toBeInstanceOf(LoggerManager);
      // …primed with the supplied global context.
      expect(manager.getGlobalContext()).toEqual({ service: "test" });
    });
  });

  describe(".forRootAsync()", () => {
    it("returns a global DynamicModule with an async config factory", () => {
      const dynamic = LoggerModule.forRootAsync({
        useFactory: async () => ({
          default: "app",
          channels: { app: {} },
          level: LogLevel.INFO,
        }),
      });
      expect(dynamic.module).toBe(LoggerModule);
      expect(dynamic.global).toBe(true);

      const providers = (dynamic.providers ?? []) as ProviderRecord[];
      const configEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === LOGGER_CONFIG_INTERNAL,
      );
      // useFactory (async) instead of useValue.
      expect(configEntry?.useFactory).toBeInstanceOf(Function);
    });

    it("the async config factory returns the caller-supplied config directly", async () => {
      const useFactory = vi.fn(async () => ({
        default: "audit",
        channels: { audit: {} },
      }));
      const dynamic = LoggerModule.forRootAsync({ useFactory });
      const providers = (dynamic.providers ?? []) as ProviderRecord[];
      const configEntry = providers.find(
        (p): p is Exclude<ProviderRecord, new (...args: unknown[]) => unknown> =>
          typeof p === "object" && "provide" in p && p.provide === LOGGER_CONFIG_INTERNAL,
      ) as Exclude<ProviderRecord, new (...args: unknown[]) => unknown>;

      const resolved = (await configEntry.useFactory!()) as { default: string };
      // The async factory's return value is the final config — no
      // merge pass anymore (env overrides run in the manager).
      expect(resolved.default).toBe("audit");
      expect(useFactory).toHaveBeenCalledTimes(1);
    });
  });
});
