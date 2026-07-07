/**
 * @file registry-helpers.test.ts
 * @module menus/__tests__/registry-helpers.test
 *
 * @description
 * Unit tests for the pure registry helpers. These are the shared plumbing
 * every menu renderer relies on — a regression here breaks all three
 * surfaces at once, so the coverage is deliberately exhaustive.
 *
 * Tests are grouped by helper:
 *
 *  - `filterVisibleCommands` — surface filter + `isVisible` predicate.
 *  - `groupByCategory` — canonical-order grouping + empty-bucket elision.
 *  - `resolveShortcutDisplay` — OS glyph mapping (delegates to
 *    `formatShortcut` but the wrapper is tested independently because
 *    renderers rely on the `undefined` return-when-empty contract).
 *  - `assertNoDuplicateShortcuts` — dev-time collision detector.
 */

import { describe, expect, it, vi } from "vitest";

import type { MenuCommand, MenuContext } from "@/menus/command.types";

import {
  assertNoDuplicateShortcuts,
  filterVisibleCommands,
  groupByCategory,
  resolveShortcutDisplay,
} from "@/menus/registry-helpers";

/** Factory — builds a stub command with sane defaults so cases stay compact. */
function makeCommand(overrides: Partial<MenuCommand> = {}): MenuCommand {
  return {
    id: overrides.id ?? "test.command",
    labelKey: overrides.labelKey ?? "menu.test",
    category: overrides.category ?? "help",
    execute: overrides.execute ?? ((): void => undefined),
    ...overrides,
  };
}

/** Empty-context helper — most cases don't exercise ctx-dependent behaviour. */
const EMPTY_CONTEXT: MenuContext = {};

// ---------------------------------------------------------------------------
// filterVisibleCommands
// ---------------------------------------------------------------------------

describe("filterVisibleCommands", () => {
  it("includes a command when its surfaces contain the target", () => {
    const command = makeCommand({ surfaces: ["app", "context"] });
    const result = filterVisibleCommands([command], "app", EMPTY_CONTEXT);

    expect(result).toEqual([command]);
  });

  it("excludes a command when the target surface is not in its list", () => {
    const command = makeCommand({ surfaces: ["native"] });
    const result = filterVisibleCommands([command], "app", EMPTY_CONTEXT);

    expect(result).toEqual([]);
  });

  it("defaults to all-surfaces when the command omits surfaces", () => {
    const command = makeCommand({ surfaces: undefined });

    expect(filterVisibleCommands([command], "app", EMPTY_CONTEXT)).toEqual([command]);
    expect(filterVisibleCommands([command], "context", EMPTY_CONTEXT)).toEqual([command]);
    expect(filterVisibleCommands([command], "native", EMPTY_CONTEXT)).toEqual([command]);
  });

  it("invokes isVisible AFTER the surface filter", () => {
    // Predicate throws so we can detect if it was called on a surface miss.
    const isVisible = vi.fn(() => true);
    const command = makeCommand({ surfaces: ["native"], isVisible });

    filterVisibleCommands([command], "app", EMPTY_CONTEXT);

    expect(isVisible).not.toHaveBeenCalled();
  });

  it("hides a command when isVisible returns false", () => {
    const command = makeCommand({ isVisible: () => false });

    expect(filterVisibleCommands([command], "app", EMPTY_CONTEXT)).toEqual([]);
  });

  it("passes the context through to isVisible", () => {
    const isVisible = vi.fn(() => true);
    const ctx: MenuContext = { source: "context-menu" };
    const command = makeCommand({ isVisible });

    filterVisibleCommands([command], "context", ctx);

    expect(isVisible).toHaveBeenCalledWith(ctx);
  });

  it("preserves relative order of the input list", () => {
    const a = makeCommand({ id: "a" });
    const b = makeCommand({ id: "b" });
    const c = makeCommand({ id: "c" });
    const result = filterVisibleCommands([a, b, c], "app", EMPTY_CONTEXT);

    expect(result.map((command) => command.id)).toEqual(["a", "b", "c"]);
  });
});

// ---------------------------------------------------------------------------
// groupByCategory
// ---------------------------------------------------------------------------

describe("groupByCategory", () => {
  it("groups commands by category", () => {
    const help = makeCommand({ id: "help.docs", category: "help" });
    const view = makeCommand({ id: "view.command_palette", category: "view" });
    const grouped = groupByCategory([help, view]);

    expect(grouped.get("help")).toEqual([help]);
    expect(grouped.get("view")).toEqual([view]);
  });

  it("emits keys in canonical MENU_CATEGORY_ORDER regardless of input order", () => {
    const help = makeCommand({ id: "h", category: "help" });
    const application = makeCommand({ id: "a", category: "application" });
    const view = makeCommand({ id: "v", category: "view" });
    const grouped = groupByCategory([help, view, application]);

    // `application` precedes `view` precedes `help` per MENU_CATEGORY_ORDER.
    expect([...grouped.keys()]).toEqual(["application", "view", "help"]);
  });

  it("elides empty categories from the output", () => {
    const help = makeCommand({ category: "help" });
    const grouped = groupByCategory([help]);

    expect(grouped.has("workspace")).toBe(false);
    expect(grouped.size).toBe(1);
  });

  it("preserves relative order within a bucket", () => {
    const a = makeCommand({ id: "help.a", category: "help" });
    const b = makeCommand({ id: "help.b", category: "help" });
    const c = makeCommand({ id: "help.c", category: "help" });
    const grouped = groupByCategory([a, b, c]);

    expect(grouped.get("help")).toEqual([a, b, c]);
  });

  it("returns an empty Map for an empty input", () => {
    expect(groupByCategory([]).size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// resolveShortcutDisplay
// ---------------------------------------------------------------------------

describe("resolveShortcutDisplay", () => {
  it("returns undefined when the command has no shortcut", () => {
    const command = makeCommand({ shortcut: undefined });

    expect(resolveShortcutDisplay(command)).toBeUndefined();
  });

  it("maps modifier accelerators to mac glyphs on mac", () => {
    const command = makeCommand({ shortcut: "CmdOrCtrl+K" });

    expect(resolveShortcutDisplay(command, "mac")).toBe("⌘K");
  });

  it("maps modifier accelerators to text on Windows/Linux", () => {
    const command = makeCommand({ shortcut: "CmdOrCtrl+K" });

    expect(resolveShortcutDisplay(command, "windows")).toBe("Ctrl+K");
    expect(resolveShortcutDisplay(command, "linux")).toBe("Ctrl+K");
  });

  it("upper-cases chord shortcuts unchanged", () => {
    const command = makeCommand({ shortcut: "g a" });

    expect(resolveShortcutDisplay(command, "mac")).toBe("G A");
  });

  it("handles multi-modifier combos", () => {
    const command = makeCommand({ shortcut: "CmdOrCtrl+Shift+T" });

    expect(resolveShortcutDisplay(command, "mac")).toBe("⌘⇧T");
    expect(resolveShortcutDisplay(command, "windows")).toBe("Ctrl+Shift+T");
  });
});

// ---------------------------------------------------------------------------
// assertNoDuplicateShortcuts
// ---------------------------------------------------------------------------

describe("assertNoDuplicateShortcuts", () => {
  it("returns an empty array when no collisions exist", () => {
    const a = makeCommand({ id: "a", shortcut: "CmdOrCtrl+K" });
    const b = makeCommand({ id: "b", shortcut: "CmdOrCtrl+\\" });
    const report = vi.fn();
    const result = assertNoDuplicateShortcuts([a, b], "app", report);

    expect(result).toEqual([]);
    expect(report).not.toHaveBeenCalled();
  });

  it("detects a two-way collision and reports it", () => {
    const a = makeCommand({ id: "a", shortcut: "CmdOrCtrl+K" });
    const b = makeCommand({ id: "b", shortcut: "CmdOrCtrl+K" });
    const report = vi.fn();
    const result = assertNoDuplicateShortcuts([a, b], "app", report);

    expect(result).toHaveLength(1);
    expect(result[0]?.ids).toEqual(["a", "b"]);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]?.[0]).toContain('"a"');
    expect(report.mock.calls[0]?.[0]).toContain('"b"');
  });

  it("normalises case so `Cmd+K` and `cmd+k` collide", () => {
    const a = makeCommand({ id: "a", shortcut: "Cmd+K" });
    const b = makeCommand({ id: "b", shortcut: "cmd+k" });
    const report = vi.fn();
    const result = assertNoDuplicateShortcuts([a, b], "app", report);

    expect(result).toHaveLength(1);
  });

  it("ignores commands whose surface does not match the target", () => {
    const a = makeCommand({ id: "a", shortcut: "CmdOrCtrl+K", surfaces: ["native"] });
    const b = makeCommand({ id: "b", shortcut: "CmdOrCtrl+K", surfaces: ["app"] });
    const report = vi.fn();
    const result = assertNoDuplicateShortcuts([a, b], "app", report);

    expect(result).toEqual([]);
    expect(report).not.toHaveBeenCalled();
  });

  it("ignores commands without a shortcut", () => {
    const a = makeCommand({ id: "a", shortcut: undefined });
    const b = makeCommand({ id: "b", shortcut: undefined });
    const report = vi.fn();
    const result = assertNoDuplicateShortcuts([a, b], "app", report);

    expect(result).toEqual([]);
    expect(report).not.toHaveBeenCalled();
  });

  it("reports every id involved in a three-way collision", () => {
    const a = makeCommand({ id: "a", shortcut: "CmdOrCtrl+K" });
    const b = makeCommand({ id: "b", shortcut: "CmdOrCtrl+K" });
    const c = makeCommand({ id: "c", shortcut: "CmdOrCtrl+K" });
    const report = vi.fn();
    const result = assertNoDuplicateShortcuts([a, b, c], "app", report);

    expect(result).toHaveLength(1);
    expect(result[0]?.ids).toEqual(["a", "b", "c"]);
  });
});
