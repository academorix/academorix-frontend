/**
 * @file reporters.spec.ts
 * @module @stackra/logger/__tests__/unit
 * @description Behavioural spec for the built-in reporters —
 *   `ConsoleReporter`, `JsonReporter`, `SilentReporter`. Each is
 *   exercised through its public `write(entry)` surface without
 *   booting a full LoggerManager.
 */

import { describe, expect, it, vi } from "vitest";

import { LogLevel, type ILogEntry } from "@stackra/contracts";

import { ConsoleReporter } from "@/core/reporters/console.reporter";
import { JsonReporter } from "@/core/reporters/json.reporter";
import { SilentReporter } from "@/core/reporters/silent.reporter";

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

/** Well-formed entry for the reporters — override only what a spec needs. */
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
// SilentReporter
// ────────────────────────────────────────────────────────────────────────

describe("SilentReporter", () => {
  it('has `name === "silent"` and its `write()` is a no-op that writes nothing to console', () => {
    // Every console method is spied to prove the reporter really is
    // silent — no accidental noise leaks through.
    const reporter = new SilentReporter();
    const spies = ["log", "info", "warn", "error", "debug"].map((m) =>
      vi.spyOn(console, m as "log").mockImplementation(() => undefined),
    );
    reporter.write(buildEntry());
    reporter.write(buildEntry({ level: LogLevel.ERROR, error: new Error("boom") }));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(reporter.name).toBe("silent");
  });
});

// ────────────────────────────────────────────────────────────────────────
// JsonReporter
// ────────────────────────────────────────────────────────────────────────

describe("JsonReporter", () => {
  it('has `name === "json"` and emits ONE stringified JSON line to console.log per entry', () => {
    const reporter = new JsonReporter();
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    reporter.write(buildEntry({ message: "user-created", meta: { userId: "u1" } }));
    expect(reporter.name).toBe("json");
    expect(spy).toHaveBeenCalledTimes(1);
    // Line MUST be a single valid JSON string.
    const [line] = spy.mock.calls[0];
    expect(typeof line).toBe("string");
    const parsed = JSON.parse(line as string);
    expect(parsed).toMatchObject({
      level: LogLevel.INFO,
      message: "user-created",
      context: "TestContext",
      meta: { userId: "u1" },
    });
  });

  it('omits an empty `meta` object from the emitted JSON (avoids `"meta":{}` noise)', () => {
    // A behavioural nicety of the reporter — it only serialises
    // meta when it has at least one key.
    const reporter = new JsonReporter();
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    reporter.write(buildEntry({ meta: {} }));
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.meta).toBeUndefined();
  });

  it("serialises an attached Error as `{ name, message, stack }`", () => {
    const reporter = new JsonReporter();
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const err = new TypeError("bad arg");
    reporter.write(buildEntry({ level: LogLevel.ERROR, error: err }));
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.error).toEqual({
      name: "TypeError",
      message: "bad arg",
      stack: err.stack,
    });
  });
});

// ────────────────────────────────────────────────────────────────────────
// ConsoleReporter
// ────────────────────────────────────────────────────────────────────────

describe("ConsoleReporter", () => {
  it('has `name === "console"`', () => {
    expect(new ConsoleReporter().name).toBe("console");
  });

  it("write() completes without throwing for every LogLevel — the underlying consola instance owns output formatting", () => {
    // The reporter delegates to `consola`, which is complex to
    // introspect from the outside. The contract at THIS layer is:
    // "write must never throw regardless of the entry level or
    // whether meta / error are present."
    const reporter = new ConsoleReporter();
    // Silence stderr/stdout while consola runs.
    const noopSpies = ["log", "info", "warn", "error", "debug"].map((m) =>
      vi.spyOn(console, m as "log").mockImplementation(() => undefined),
    );
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.NOTICE,
      LogLevel.WARNING,
      LogLevel.ERROR,
      LogLevel.CRITICAL,
      LogLevel.EMERGENCY,
      LogLevel.ALERT,
    ];
    for (const level of levels) {
      expect(() =>
        reporter.write(
          buildEntry({
            level,
            meta: { some: "meta" },
            error: level === LogLevel.ERROR ? new Error("x") : undefined,
          }),
        ),
      ).not.toThrow();
    }
    // Not asserting call counts — consola may buffer or format
    // differently across versions.
    for (const spy of noopSpies) spy.mockRestore();
  });
});
