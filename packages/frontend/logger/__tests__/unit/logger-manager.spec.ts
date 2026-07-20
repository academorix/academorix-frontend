/**
 * @file logger-manager.spec.ts
 * @module @stackra/logger/__tests__/unit
 * @description Behavioural spec for `LoggerManager` — the central
 *   dispatcher that resolves named channels, filters by level, runs
 *   the enrichment pipeline, dispatches to reporters (fail-open),
 *   and manages global context. Exercises the observable surface only.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogLevel, type ILogEntry, type ILogReporter, type ILogEnricher } from "@stackra/contracts";

import { LoggerManager } from "@/core/services/logger-manager.service";

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Reporter test-double that captures every entry it receives.
 */
class CapturingReporter implements ILogReporter {
  public readonly written: ILogEntry[] = [];
  public constructor(public readonly name: string) {}
  public write(entry: ILogEntry): void {
    this.written.push(entry);
  }
}

/**
 * Reporter that always throws — used to verify fail-open semantics
 * (a bad reporter must never bring the whole dispatch pipeline down).
 */
class ThrowingReporter implements ILogReporter {
  public constructor(public readonly name: string) {}
  public write(): void {
    throw new Error(`${this.name} exploded`);
  }
}

/**
 * Build a well-formed log entry — sensible defaults so specs only
 * spell out the fields they care about.
 */
function buildEntry(overrides: Partial<ILogEntry> = {}): ILogEntry {
  return {
    level: LogLevel.INFO,
    message: "hello",
    context: "TestContext",
    timestamp: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("LoggerManager", () => {
  // Reset the static instance between specs so `Logger` fallback
  // tests in other files don't interact with these.
  beforeEach(() => {
    LoggerManager.instance = null;
  });

  // ────────────────────────────────────────────────────────────────
  // Construction + defaults
  // ────────────────────────────────────────────────────────────────

  describe("construction", () => {
    it("exposes the configured default channel via `getDefaultDriver()`", () => {
      const mgr = new LoggerManager({
        default: "primary",
        channels: { primary: { reporters: [] } },
      });
      expect(mgr.getDefaultDriver()).toBe("primary");
    });

    it("sets the static `LoggerManager.instance` reference on construction", () => {
      const mgr = new LoggerManager({ default: "a", channels: { a: {} } });
      // The Logger facade reads this reference when no manager is
      // supplied — construction must always populate it.
      expect(LoggerManager.instance).toBe(mgr);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Channel routing
  // ────────────────────────────────────────────────────────────────

  describe("channel routing", () => {
    it("routes to the reporters listed in the target channel and NO others", () => {
      const console = new CapturingReporter("console");
      const audit = new CapturingReporter("audit");

      const mgr = new LoggerManager({
        default: "app",
        channels: {
          app: { reporters: ["console"] },
          audit: { reporters: ["audit"] },
        },
      });
      mgr.registerReporter(console);
      mgr.registerReporter(audit);

      mgr.dispatch(buildEntry({ message: "to-app" }));
      mgr.dispatch(buildEntry({ message: "to-audit" }), "audit");

      expect(console.written.map((e) => e.message)).toEqual(["to-app"]);
      expect(audit.written.map((e) => e.message)).toEqual(["to-audit"]);
    });

    it("caches resolved channels via the Manager base — subsequent dispatches reuse the same driver", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"] } },
      });
      mgr.registerReporter(rep);

      // Warm the cache.
      const first = mgr.driver("app");
      // Second call MUST return the same object (== identity).
      const second = mgr.driver("app");
      expect(first).toBe(second);
    });

    it("emits a graceful stderr fallback on channel resolution failure (dispatch never throws)", () => {
      // No channel called "ghost" is registered — dispatch must
      // fall back to EmergencyLogger.log and warn on stderr, NEVER
      // propagate the resolution error to the caller.
      const mgr = new LoggerManager({ default: "app", channels: { app: {} } });
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      expect(() => mgr.dispatch(buildEntry({ message: "lost" }), "ghost")).not.toThrow();
      // Emergency logger uses console.error twice — once for the
      // entry itself, once for the warning about the misconfig.
      expect(errSpy).toHaveBeenCalledTimes(2);
      const combined = errSpy.mock.calls.map((c) => String(c[0])).join("\n");
      expect(combined).toContain("lost");
      expect(combined).toContain("ghost");
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Level filtering
  //
  // `LOG_LEVEL_PRIORITY` treats LOWER numbers as HIGHER severity
  // (EMERGENCY = 0 … DEBUG = 7). To drop entries below a channel's
  // threshold, the manager's filter compares priorities with `>`
  // (drop when the entry's number is greater — severity is lower).
  // ────────────────────────────────────────────────────────────────

  describe("level filtering", () => {
    it("accepts every entry on channels with no configured level", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"] } }, // no `level`
      });
      mgr.registerReporter(rep);

      mgr.dispatch(buildEntry({ level: LogLevel.DEBUG }));
      mgr.dispatch(buildEntry({ level: LogLevel.EMERGENCY }));
      expect(rep.written).toHaveLength(2);
    });

    it("drops entries whose severity is below the channel threshold", () => {
      // With channel level=INFO (priority 6):
      //   - DEBUG (7): 7 > 6 → TRUE  → dropped.
      //   - INFO  (6): 6 > 6 → false → kept.
      //   - ERROR (3): 3 > 6 → false → kept (higher severity).
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"], level: LogLevel.INFO } },
      });
      mgr.registerReporter(rep);
      mgr.dispatch(buildEntry({ level: LogLevel.DEBUG, message: "debug-drop" }));
      mgr.dispatch(buildEntry({ level: LogLevel.INFO, message: "info-keep" }));
      mgr.dispatch(buildEntry({ level: LogLevel.ERROR, message: "error-keep" }));
      expect(rep.written.map((e) => e.message)).toEqual(["info-keep", "error-keep"]);
    });

    it("respects `setLevel()` at runtime", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"], level: LogLevel.INFO } },
      });
      mgr.registerReporter(rep);
      // Before the level widens, DEBUG is dropped.
      mgr.dispatch(buildEntry({ level: LogLevel.DEBUG, message: "drop-1" }));
      mgr.setLevel("app", LogLevel.DEBUG);
      // After the widening, DEBUG passes.
      mgr.dispatch(buildEntry({ level: LogLevel.DEBUG, message: "keep-1" }));
      expect(rep.written.map((e) => e.message)).toEqual(["keep-1"]);
    });

    it("`setLevel()` mutates the channel config and invalidates the cached driver (independent of the filter direction)", () => {
      // This spec targets ONLY the cache invalidation contract of
      // setLevel — that after the call the resolved channel reflects
      // the new level. It does not depend on the (buggy) filter
      // direction.
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"], level: LogLevel.WARNING } },
      });
      mgr.registerReporter(rep);
      const before = mgr.driver("app");
      mgr.setLevel("app", LogLevel.DEBUG);
      const after = mgr.driver("app");
      // Different driver instance — the cache was invalidated…
      expect(after).not.toBe(before);
      // …and the level actually changed on the resolved channel.
      expect(after.config.level).toBe(LogLevel.DEBUG);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Enrichment pipeline
  // ────────────────────────────────────────────────────────────────

  describe("enrichment pipeline", () => {
    it("runs enrichers in registration order (added last runs last)", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"] } },
      });
      mgr.registerReporter(rep);

      // Each enricher stamps a marker into meta so we can read the
      // pipeline order off the entry's meta.
      const stamp = (label: string): ILogEnricher => ({
        enrich: (entry) => ({
          ...entry,
          meta: {
            ...(entry.meta ?? {}),
            order: [...((entry.meta?.order ?? []) as string[]), label],
          },
        }),
      });
      mgr.addEnricher(stamp("a"));
      mgr.addEnricher(stamp("b"));
      // Prepending puts an enricher at the FRONT of the queue.
      mgr.prependEnricher(stamp("front"));

      mgr.dispatch(buildEntry());
      expect(rep.written[0].meta?.order).toEqual(["front", "a", "b"]);
    });

    it("drops the entry when an enricher returns null (sampling / rate-limit shape)", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"] } },
      });
      mgr.registerReporter(rep);

      // The docblock states: "Returning `null` drops the entry from
      // the pipeline (used by sampling / rate-limiting enrichers)."
      mgr.addEnricher({ enrich: () => null });

      mgr.dispatch(buildEntry({ message: "lost" }));
      expect(rep.written).toHaveLength(0);
    });

    it("is fail-soft — a throwing enricher does not break the pipeline", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"] } },
      });
      mgr.registerReporter(rep);

      // First enricher throws — the manager MUST skip it and
      // continue with the next one instead of aborting the pipe.
      mgr.addEnricher({
        enrich: () => {
          throw new Error("bad enricher");
        },
      });
      mgr.addEnricher({
        enrich: (entry) => ({ ...entry, meta: { ...(entry.meta ?? {}), safe: true } }),
      });

      mgr.dispatch(buildEntry({ meta: { starting: true } }));
      expect(rep.written).toHaveLength(1);
      expect(rep.written[0].meta).toEqual({ starting: true, safe: true });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Global context
  // ────────────────────────────────────────────────────────────────

  describe("global context", () => {
    it("merges the global context into every dispatched entry (entry meta wins on conflict)", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"] } },
      });
      mgr.registerReporter(rep);

      mgr.setGlobalContext({ env: "test", shared: "from-global" });

      mgr.dispatch(buildEntry({ meta: { shared: "from-entry", local: true } }));

      const meta = rep.written[0].meta;
      // `env` came from global; `shared` from entry wins the merge;
      // `local` came from entry.
      expect(meta).toEqual({ env: "test", shared: "from-entry", local: true });
    });

    it("exposes the current global context as an independent snapshot via `getGlobalContext()`", () => {
      const mgr = new LoggerManager({ default: "a", channels: { a: {} } });
      mgr.setGlobalContext({ env: "test" });
      const snapshot = mgr.getGlobalContext();
      snapshot["env"] = "mutated";
      // The internal store must be unaffected by mutation of the
      // returned snapshot.
      expect(mgr.getGlobalContext()).toEqual({ env: "test" });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Fail-open reporters + flush
  // ────────────────────────────────────────────────────────────────

  describe("reporter isolation", () => {
    it("is fail-open — a throwing reporter does not stop the rest", () => {
      const throwing = new ThrowingReporter("bad");
      const good = new CapturingReporter("good");

      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["bad", "good"] } },
      });
      mgr.registerReporter(throwing);
      mgr.registerReporter(good);

      expect(() => mgr.dispatch(buildEntry({ message: "survive" }))).not.toThrow();
      expect(good.written).toHaveLength(1);
      expect(good.written[0].message).toBe("survive");
    });
  });

  describe("flush()", () => {
    it("calls `flush()` on every registered reporter that provides one and settles even on failures", async () => {
      const flushA = vi.fn().mockResolvedValue(undefined);
      const flushB = vi.fn().mockRejectedValue(new Error("reporter-b broke"));

      const mgr = new LoggerManager({ default: "app", channels: { app: {} } });
      mgr.registerReporter({ name: "a", write: () => undefined, flush: flushA });
      mgr.registerReporter({ name: "b", write: () => undefined, flush: flushB });
      mgr.registerReporter({ name: "c", write: () => undefined }); // no flush()

      // `flush()` waits for allSettled — so a rejected flush must
      // not cause the returned promise to reject.
      await expect(mgr.flush()).resolves.toBeUndefined();
      expect(flushA).toHaveBeenCalledTimes(1);
      expect(flushB).toHaveBeenCalledTimes(1);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Named accessors
  // ────────────────────────────────────────────────────────────────

  describe("accessors", () => {
    it("lists registered reporter names via `getReporterNames()`", () => {
      const mgr = new LoggerManager({ default: "app", channels: { app: {} } });
      mgr.registerReporter({ name: "x", write: () => undefined });
      mgr.registerReporter({ name: "y", write: () => undefined });
      expect(mgr.getReporterNames().sort()).toEqual(["x", "y"]);
    });

    it("creates Logger and channel-bound Logger instances via `create()` / `channel()`", () => {
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: {}, audit: {} },
      });
      // A quick sanity assertion — the returned loggers implement
      // the surface consumers rely on (level methods).
      const a = mgr.create("Ctx");
      const b = mgr.channel("Ctx", "audit");
      expect(typeof a.info).toBe("function");
      expect(typeof b.warning).toBe("function");
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Stack channels
  // ────────────────────────────────────────────────────────────────

  describe("stack channels", () => {
    it("fans out entries to every sub-channel's reporters", () => {
      const consoleRep = new CapturingReporter("console");
      const jsonRep = new CapturingReporter("json");
      const mgr = new LoggerManager({
        default: "all",
        channels: {
          console: { reporters: ["console"] },
          json: { reporters: ["json"] },
          // A stack channel enumerates its sub-channels and
          // aggregates their resolved reporters.
          all: { type: "stack", channels: ["console", "json"], reporters: [] },
        },
      });
      mgr.registerReporter(consoleRep);
      mgr.registerReporter(jsonRep);

      mgr.dispatch(buildEntry({ message: "to-all" }));
      expect(consoleRep.written).toHaveLength(1);
      expect(jsonRep.written).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Channel management
  // ────────────────────────────────────────────────────────────────

  describe("channel management", () => {
    it("adds a channel at runtime, becoming resolvable via `dispatch`", () => {
      const rep = new CapturingReporter("r");
      const mgr = new LoggerManager({
        default: "app",
        channels: { app: { reporters: ["r"] } },
      });
      mgr.registerReporter(rep);

      mgr.addChannel("audit", { reporters: ["r"] });
      mgr.dispatch(buildEntry({ level: LogLevel.INFO, message: "to-audit" }), "audit");
      expect(rep.written.map((e) => e.message)).toEqual(["to-audit"]);
    });

    it("exposes runtime-added channel config via `getChannel(name)`", () => {
      const mgr = new LoggerManager({ default: "app", channels: { app: {} } });
      mgr.addChannel("audit", { reporters: [] });
      expect(mgr.getChannel("audit")).toBeDefined();
      expect(mgr.getChannel("ghost")).toBeUndefined();
    });
  });
});
