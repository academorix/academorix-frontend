/**
 * Unit Tests — ShortcutRegistry
 *
 * Tests for the shortcut registry which manages keyboard bindings,
 * scope stacking, and conflict detection.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@stackra/container", () => ({
  Injectable: () => (target: any) => target,
  Inject: () => () => {},
  Optional: () => () => {},
}));

const mockWarn = vi.fn();
vi.mock("@stackra/logger", () => ({
  Logger: class MockLogger {
    warn = mockWarn;
  },
}));

vi.mock("@/utils/browser-shortcut-conflicts.util", () => ({
  isReservedBrowserCombo: vi.fn(() => false),
  comboToCanonical: vi.fn((combo: any) => combo.key ?? "unknown"),
}));

import { ShortcutRegistry } from "../../src/registries/shortcut.registry";
import { isReservedBrowserCombo } from "../../src/utils/browser-shortcut-conflicts.util";
import type { Shortcut } from "../../src/interfaces/shortcut.interface";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";

describe("ShortcutRegistry", () => {
  let registry: ShortcutRegistry;

  const makeShortcut = (overrides: Partial<Shortcut> = {}): Shortcut => ({
    id: "test.shortcut",
    description: "Test shortcut",
    combo: { mod: true, key: "k" },
    handler: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    registry = new ShortcutRegistry();
  });

  // ── registerShortcut ──────────────────────────────────────────────────────

  describe("registerShortcut", () => {
    it("adds a shortcut to the registry", () => {
      const shortcut = makeShortcut({ id: "editor.save" });
      registry.registerShortcut(shortcut);

      expect(registry.get("editor.save")).toEqual(shortcut);
    });

    it("replaces an existing shortcut with the same id", () => {
      const original = makeShortcut({ id: "editor.save", description: "Original" });
      const updated = makeShortcut({ id: "editor.save", description: "Updated" });

      registry.registerShortcut(original);
      registry.registerShortcut(updated);

      expect(registry.get("editor.save")?.description).toBe("Updated");
    });

    it("warns on reserved combos", () => {
      vi.mocked(isReservedBrowserCombo).mockReturnValueOnce(true);

      const shortcut = makeShortcut({ id: "browser.newtab", combo: { mod: true, key: "t" } });
      registry.registerShortcut(shortcut);

      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining("browser.newtab"));
    });

    it("does not warn when silenceReservedWarnings is true", () => {
      vi.mocked(isReservedBrowserCombo).mockReturnValueOnce(true);

      const silentRegistry = new ShortcutRegistry({ silenceReservedWarnings: true } as any);
      const shortcut = makeShortcut({ id: "browser.newtab", combo: { mod: true, key: "t" } });
      silentRegistry.registerShortcut(shortcut);

      expect(mockWarn).not.toHaveBeenCalled();
    });

    it("checks each combo in an array for reserved conflicts", () => {
      vi.mocked(isReservedBrowserCombo).mockReturnValue(true);

      const shortcut = makeShortcut({
        id: "multi.combo",
        combo: [
          { mod: true, key: "t" },
          { mod: true, key: "w" },
        ],
      });
      registry.registerShortcut(shortcut);

      expect(mockWarn).toHaveBeenCalledTimes(2);
    });
  });

  // ── unregisterShortcut ────────────────────────────────────────────────────

  describe("unregisterShortcut", () => {
    it("removes a shortcut by id", () => {
      const shortcut = makeShortcut({ id: "editor.save" });
      registry.registerShortcut(shortcut);
      registry.unregisterShortcut("editor.save");

      expect(registry.get("editor.save")).toBeUndefined();
    });

    it("does nothing for non-existent ids", () => {
      expect(() => registry.unregisterShortcut("nonexistent")).not.toThrow();
    });
  });

  // ── pushScope / popScope ──────────────────────────────────────────────────

  describe("pushScope / popScope", () => {
    it("pushes a scope onto the stack", () => {
      registry.pushScope("modal");
      expect(registry.getActiveScopes()).toContain("modal");
    });

    it("pops the top scope", () => {
      registry.pushScope("modal");
      registry.popScope();
      expect(registry.getActiveScopes()).not.toContain("modal");
    });

    it("supports nested scopes", () => {
      registry.pushScope("panel");
      registry.pushScope("modal");

      const scopes = registry.getActiveScopes();
      expect(scopes).toEqual(["panel", "modal"]);
    });

    it("popScope with expected scope only pops if it matches top", () => {
      registry.pushScope("panel");
      registry.pushScope("modal");

      // Try to pop "panel" — should not pop because "modal" is on top
      registry.popScope("panel");
      expect(registry.getActiveScopes()).toEqual(["panel", "modal"]);
    });

    it("popScope with expected scope pops when it matches top", () => {
      registry.pushScope("panel");
      registry.pushScope("modal");

      registry.popScope("modal");
      expect(registry.getActiveScopes()).toEqual(["panel"]);
    });

    it("popScope on empty stack does nothing", () => {
      expect(() => registry.popScope()).not.toThrow();
      expect(registry.getActiveScopes()).toEqual([]);
    });
  });

  // ── getActiveScopes ───────────────────────────────────────────────────────

  describe("getActiveScopes", () => {
    it("returns empty array initially", () => {
      expect(registry.getActiveScopes()).toEqual([]);
    });

    it("returns the current scope stack", () => {
      registry.pushScope("panel");
      registry.pushScope("modal");
      expect(registry.getActiveScopes()).toEqual(["panel", "modal"]);
    });
  });

  // ── getActiveShortcuts ────────────────────────────────────────────────────

  describe("getActiveShortcuts", () => {
    it("returns scoped shortcuts before global ones", () => {
      const globalShortcut = makeShortcut({ id: "global.one", scope: "global" });
      const scopedShortcut = makeShortcut({ id: "modal.one", scope: "modal" });

      registry.registerShortcut(globalShortcut);
      registry.registerShortcut(scopedShortcut);
      registry.pushScope("modal");

      const active = registry.getActiveShortcuts();
      const ids = active.map((s) => s.id);

      expect(ids.indexOf("modal.one")).toBeLessThan(ids.indexOf("global.one"));
    });

    it("includes global shortcuts always", () => {
      const globalShortcut = makeShortcut({ id: "global.one", scope: "global" });
      registry.registerShortcut(globalShortcut);

      const active = registry.getActiveShortcuts();
      expect(active.map((s) => s.id)).toContain("global.one");
    });

    it("includes shortcuts without explicit scope as global", () => {
      const noScopeShortcut = makeShortcut({ id: "no.scope" });
      // No scope field — treated as global
      delete (noScopeShortcut as any).scope;
      registry.registerShortcut(noScopeShortcut);

      const active = registry.getActiveShortcuts();
      expect(active.map((s) => s.id)).toContain("no.scope");
    });

    it("excludes scoped shortcuts when their scope is not active", () => {
      const scopedShortcut = makeShortcut({ id: "modal.one", scope: "modal" });
      registry.registerShortcut(scopedShortcut);

      // No scope pushed
      const active = registry.getActiveShortcuts();
      expect(active.map((s) => s.id)).not.toContain("modal.one");
    });

    it("orders top-most scope first when multiple scopes are active", () => {
      const panelShortcut = makeShortcut({ id: "panel.one", scope: "panel" });
      const modalShortcut = makeShortcut({ id: "modal.one", scope: "modal" });

      registry.registerShortcut(panelShortcut);
      registry.registerShortcut(modalShortcut);
      registry.pushScope("panel");
      registry.pushScope("modal");

      const active = registry.getActiveShortcuts();
      const ids = active.map((s) => s.id);

      // modal is top-most, so it should come first
      expect(ids.indexOf("modal.one")).toBeLessThan(ids.indexOf("panel.one"));
    });
  });

  // ── groupByType ───────────────────────────────────────────────────────────

  describe("groupByType", () => {
    it("groups shortcuts by type", () => {
      registry.registerShortcut(makeShortcut({ id: "edit.save", type: "editing" }));
      registry.registerShortcut(makeShortcut({ id: "edit.copy", type: "editing" }));
      registry.registerShortcut(makeShortcut({ id: "nav.home", type: "navigation" }));

      const groups = registry.groupByType();
      expect(groups.get("editing")?.length).toBe(2);
      expect(groups.get("navigation")?.length).toBe(1);
    });

    it("uses category as fallback for type", () => {
      registry.registerShortcut(
        makeShortcut({ id: "cat.one", type: undefined, category: "tools" }),
      );

      const groups = registry.groupByType();
      expect(groups.has("tools")).toBe(true);
    });

    it("defaults to 'general' when no type or category", () => {
      const shortcut = makeShortcut({ id: "no.type" });
      delete (shortcut as any).type;
      delete (shortcut as any).category;
      registry.registerShortcut(shortcut);

      const groups = registry.groupByType();
      expect(groups.has("general")).toBe(true);
    });

    it("excludes hidden shortcuts", () => {
      registry.registerShortcut(makeShortcut({ id: "hidden.one", hidden: true, type: "editing" }));
      registry.registerShortcut(
        makeShortcut({ id: "visible.one", hidden: false, type: "editing" }),
      );

      const groups = registry.groupByType();
      const editingIds = groups.get("editing")?.map((s) => s.id) ?? [];
      expect(editingIds).not.toContain("hidden.one");
      expect(editingIds).toContain("visible.one");
    });

    it("filters by scope when provided", () => {
      registry.registerShortcut(makeShortcut({ id: "modal.one", scope: "modal", type: "editing" }));
      registry.registerShortcut(
        makeShortcut({ id: "global.one", scope: "global", type: "editing" }),
      );
      registry.registerShortcut(makeShortcut({ id: "panel.one", scope: "panel", type: "editing" }));

      const groups = registry.groupByType("modal");
      const editingIds = groups.get("editing")?.map((s) => s.id) ?? [];

      expect(editingIds).toContain("modal.one");
      expect(editingIds).toContain("global.one");
      expect(editingIds).not.toContain("panel.one");
    });
  });
});
