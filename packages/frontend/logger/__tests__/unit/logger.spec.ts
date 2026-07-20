/**
 * @file logger.spec.ts
 * @module @stackra/logger/__tests__/unit
 * @description Behavioural spec for the `Logger` facade — the
 *   context-bound instance created by
 *   `LoggerManager.create(context)`. Covers level-method routing,
 *   metadata inheritance (child / withContext / withoutContext),
 *   and the safe-fallback path when no manager is wired.
 */

import { describe, expect, it, vi } from "vitest";

import { LogLevel, type ILogEntry } from "@stackra/contracts";

import { Logger } from "@/core/services/logger.service";
import { LoggerManager } from "@/core/services/logger-manager.service";

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal `LoggerManager` for tests that need a live dispatch
 * target. We stub `dispatch` on the returned instance so specs can
 * assert on the entries the Logger produces without booting reporters.
 */
function buildManager(): LoggerManager & { dispatched: ILogEntry[] } {
  const manager = new LoggerManager({
    default: "app",
    channels: { app: { reporters: [] } },
  }) as LoggerManager & { dispatched: ILogEntry[] };
  manager.dispatched = [];
  vi.spyOn(manager, "dispatch").mockImplementation((entry: ILogEntry, _channel?: string) => {
    manager.dispatched.push(entry);
  });
  return manager;
}

// ────────────────────────────────────────────────────────────────────────
// Specs — level methods
// ────────────────────────────────────────────────────────────────────────

describe("Logger", () => {
  describe("level methods", () => {
    it("dispatches at LogLevel.DEBUG for `.debug(...)`", () => {
      const manager = buildManager();
      new Logger("Ctx", undefined, manager).debug("boot", { flag: true });
      expect(manager.dispatched).toHaveLength(1);
      const [entry] = manager.dispatched;
      expect(entry.level).toBe(LogLevel.DEBUG);
      expect(entry.message).toBe("boot");
      expect(entry.context).toBe("Ctx");
      expect(entry.meta).toEqual({ flag: true });
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it("dispatches at LogLevel.INFO for both `.info(...)` and the generic `.log(...)`", () => {
      const manager = buildManager();
      const logger = new Logger("Ctx", undefined, manager);
      logger.info("a");
      logger.log("b");
      expect(manager.dispatched.map((e) => e.level)).toEqual([LogLevel.INFO, LogLevel.INFO]);
    });

    it("dispatches at LogLevel.WARNING for `.warn(...)` and `.warning(...)`", () => {
      const manager = buildManager();
      const logger = new Logger("Ctx", undefined, manager);
      logger.warn("deprecation");
      logger.warning("another");
      expect(manager.dispatched.map((e) => e.level)).toEqual([LogLevel.WARNING, LogLevel.WARNING]);
    });

    it("dispatches at LogLevel.ERROR with the supplied error attached", () => {
      const manager = buildManager();
      const cause = new Error("boom");
      new Logger("Ctx", undefined, manager).error("failed", cause, { code: 500 });
      const [entry] = manager.dispatched;
      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.error).toBe(cause);
      expect(entry.meta).toEqual({ code: 500 });
    });

    it("drops a non-Error error argument (only real Errors are attached)", () => {
      // The Logger converts `err instanceof Error ? err : undefined`
      // before setting `entry.error` — a plain object should not
      // leak into the entry's error field.
      const manager = buildManager();
      new Logger("Ctx", undefined, manager).error("failed", "stringly-typed", { x: 1 });
      const [entry] = manager.dispatched;
      expect(entry.error).toBeUndefined();
      expect(entry.meta).toEqual({ x: 1 });
    });

    it("dispatches severity aliases (critical/alert/emergency/notice) at their own level", () => {
      const manager = buildManager();
      const logger = new Logger("Ctx", undefined, manager);
      logger.notice("n");
      logger.critical("c");
      logger.alert("a");
      logger.emergency("e");
      expect(manager.dispatched.map((e) => e.level)).toEqual([
        LogLevel.NOTICE,
        LogLevel.CRITICAL,
        LogLevel.ALERT,
        LogLevel.EMERGENCY,
      ]);
    });

    it("routes `.fatal(...)` through EMERGENCY (fatal is an alias)", () => {
      // LogLevel.FATAL is a string-value alias for EMERGENCY, so
      // both `.emergency()` and `.fatal()` produce the same level
      // in the dispatched entry.
      const manager = buildManager();
      new Logger("Ctx", undefined, manager).fatal("down", new Error("x"));
      const [entry] = manager.dispatched;
      expect(entry.level).toBe(LogLevel.EMERGENCY);
      expect(entry.level).toBe(LogLevel.FATAL);
      expect(entry.error).toBeInstanceOf(Error);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Metadata inheritance
  // ────────────────────────────────────────────────────────────────

  describe("metadata inheritance", () => {
    it("merges initial inherited meta with per-call meta (call wins)", () => {
      const manager = buildManager();
      // The 4th constructor argument seeds the inheritedMeta bag —
      // exactly the shape `Logger.child()` produces.
      const logger = new Logger("Ctx", undefined, manager, { requestId: "r1", shared: "A" });
      logger.info("hello", { shared: "B", extra: "C" });
      expect(manager.dispatched[0].meta).toEqual({
        requestId: "r1",
        shared: "B",
        extra: "C",
      });
    });

    it("emits meta = undefined when there is no inherited AND no per-call meta", () => {
      // The Logger only sets `mergedMeta` when there IS meta to carry —
      // otherwise the entry's `meta` field stays `undefined` to avoid
      // producing `{}` at every reporter.
      const manager = buildManager();
      new Logger("Ctx", undefined, manager).info("bare");
      expect(manager.dispatched[0].meta).toBeUndefined();
    });

    it("`.child(meta)` produces a new Logger with merged, deep-independent inherited meta", () => {
      const manager = buildManager();
      const parent = new Logger("Ctx", undefined, manager, { userId: "u1" });
      const child = parent.child({ requestId: "r1" }) as Logger;

      child.info("greeting");
      const meta = manager.dispatched[0].meta;
      expect(meta).toEqual({ userId: "u1", requestId: "r1" });

      // Mutating the child's own context does NOT leak back to the
      // parent's inherited bag.
      child.withContext({ extra: "x" });
      manager.dispatched.length = 0;
      parent.info("parent-only");
      expect(manager.dispatched[0].meta).toEqual({ userId: "u1" });
    });

    it("`withContext` and `withoutContext` mutate inherited meta in place", () => {
      const manager = buildManager();
      const logger = new Logger("Ctx", undefined, manager);
      logger.withContext({ requestId: "r1", locale: "en" });
      logger.info("a");
      expect(manager.dispatched[0].meta).toEqual({ requestId: "r1", locale: "en" });

      logger.withoutContext(["locale"]);
      manager.dispatched.length = 0;
      logger.info("b");
      expect(manager.dispatched[0].meta).toEqual({ requestId: "r1" });

      // Calling `.withoutContext()` with no args clears everything.
      logger.withoutContext();
      manager.dispatched.length = 0;
      logger.info("c");
      expect(manager.dispatched[0].meta).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Fallback when no manager is available
  // ────────────────────────────────────────────────────────────────

  describe("fallback when no manager is available", () => {
    it("logs to console.log with a bracketed prefix when the static instance is null", () => {
      // Preserve and null out the static instance so the Logger
      // takes the graceful-fallback path.
      const previous = LoggerManager.instance;
      LoggerManager.instance = null;

      const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      try {
        new Logger("MyContext").info("ping");
        expect(spy).toHaveBeenCalledTimes(1);
        // Format: "[INFO] [MyContext] ping"
        expect(spy.mock.calls[0][0]).toContain("[INFO]");
        expect(spy.mock.calls[0][0]).toContain("[MyContext]");
        expect(spy.mock.calls[0][0]).toContain("ping");
      } finally {
        LoggerManager.instance = previous;
      }
    });
  });
});
