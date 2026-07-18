/**
 * @file testing-helpers.spec.ts
 * @module @stackra/logger/__tests__/unit
 * @description Behavioural spec for the `@stackra/logger/testing` surface —
 *   `MockLogger`, `MockLoggerManager`, and their assertable-proxy
 *   factories.
 */

import { describe, expect, it } from "vitest";

import {
  MockLogger,
  MockLoggerManager,
  createMockLogger,
  createMockLoggerManager,
} from "@/testing";

// ────────────────────────────────────────────────────────────────────────
// MockLogger
// ────────────────────────────────────────────────────────────────────────

describe("MockLogger", () => {
  it("records every level method into the `.logs` ledger with the right level tag", () => {
    const logger = new MockLogger();
    logger.debug("a");
    logger.info("b");
    logger.notice("c");
    logger.warning("d");
    logger.warn("e");
    logger.error("f", new Error("x"), { code: 500 });
    logger.critical("g");
    logger.alert("h");
    logger.emergency("i");
    logger.fatal("j", new Error("y"));
    logger.log("k");
    // 11 methods → 11 entries, in registration order.
    expect(logger.logs.map((l) => l.level)).toEqual([
      "debug",
      "info",
      "notice",
      "warning",
      "warn",
      "error",
      "critical",
      "alert",
      "emergency",
      "fatal",
      "log",
    ]);
  });

  it("captures `context` (metadata) and `errorOrContext` on `.error` / `.fatal`", () => {
    const logger = new MockLogger();
    const err = new TypeError("boom");
    logger.error("failed", err, { code: 500 });
    const [entry] = logger.logs;
    expect(entry.errorOrContext).toBe(err);
    expect(entry.context).toEqual({ code: 500 });
  });

  it("filters by level via `getLogsByLevel(...)`", () => {
    const logger = new MockLogger();
    logger.info("one");
    logger.info("two");
    logger.warning("three");
    const infoEntries = logger.getLogsByLevel("info");
    expect(infoEntries).toHaveLength(2);
    expect(infoEntries.map((l) => l.message)).toEqual(["one", "two"]);
  });

  it("`clearLogs()` empties the ledger in place (readonly reference is preserved)", () => {
    const logger = new MockLogger();
    const ledger = logger.logs;
    logger.info("one");
    expect(ledger).toHaveLength(1);
    logger.clearLogs();
    expect(logger.logs).toBe(ledger);
    expect(logger.logs).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────
// MockLoggerManager
// ────────────────────────────────────────────────────────────────────────

describe("MockLoggerManager", () => {
  it("memoises `create(context)` — repeat calls return the same MockLogger", () => {
    const manager = new MockLoggerManager();
    const a1 = manager.create("UserService");
    const a2 = manager.create("UserService");
    const b = manager.create("OrderService");
    // Same context → same logger.
    expect(a1).toBe(a2);
    // Different context → different logger.
    expect(a1).not.toBe(b);
  });

  it("memoises `channel(context, channelName)` under a composite key", () => {
    // The manager keys channel-bound loggers with `context::channel`
    // so a `create('X')` and a `channel('X', 'audit')` produce
    // DIFFERENT MockLogger instances.
    const manager = new MockLoggerManager();
    const bare = manager.create("X");
    const channelBound = manager.channel("X", "audit");
    expect(bare).not.toBe(channelBound);
  });

  it("exposes cached loggers via `getLogger(context)` and enumerates them via `getAllLoggers()`", () => {
    const manager = new MockLoggerManager();
    const scoped = manager.create("S");
    scoped.info("hello");
    expect(manager.getLogger("S")).toBe(scoped);
    expect(manager.getLogger("missing")).toBeUndefined();
    expect(manager.getAllLoggers().size).toBe(1);
  });

  it("`getAllLogs()` flattens entries across every scoped logger", () => {
    const manager = new MockLoggerManager();
    manager.create("A").info("a1");
    manager.create("B").info("b1");
    manager.create("B").info("b2"); // memoised — same B logger
    expect(manager.getAllLogs()).toHaveLength(3);
  });

  it("`reset()` empties every ledger AND drops every cached logger", () => {
    const manager = new MockLoggerManager();
    const scoped = manager.create("X");
    scoped.info("hello");
    manager.reset();
    expect(manager.getAllLoggers().size).toBe(0);
    // The previously-returned logger is still functional but its
    // ledger was cleared before it was dropped from the cache.
    expect(scoped.logs).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────
// Assertable proxies
// ────────────────────────────────────────────────────────────────────────

describe("createMockLogger / createMockLoggerManager", () => {
  it("createMockLogger returns a proxy that records `info(...)` with the passed args", () => {
    const logger = createMockLogger();
    logger.info("user-created", { id: "42" });
    expect(logger.$.wasCalled("info")).toBe(true);
    expect(logger.$.wasCalledWith("info", "user-created", { id: "42" })).toBe(true);
    // The underlying MockLogger's ledger is still populated too —
    // the proxy delegates to the real method by default.
    expect(logger.getLogsByLevel("info")).toHaveLength(1);
  });

  it("createMockLoggerManager returns a proxy whose `create(ctx)` is recorded and delegates to the real cache", () => {
    const manager = createMockLoggerManager();
    const scoped = manager.create("UserService");
    scoped.info("u");
    expect(manager.$.wasCalled("create")).toBe(true);
    expect(manager.$.wasCalledWith("create", "UserService")).toBe(true);
    // The manager still routes through the underlying cache — the
    // scoped logger's ledger reflects the call.
    expect(scoped.logs).toHaveLength(1);
  });
});
