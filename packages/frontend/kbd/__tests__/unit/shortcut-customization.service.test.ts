/**
 * @file shortcut-customization.service.test.ts
 * @module @stackra/kbd/tests/unit
 * @description Unit tests for the `ShortcutCustomizationService` — the
 *   user-facing "rebind this shortcut" service with persistence via
 *   `@stackra/storage`.
 *
 *   Persistence is exercised through a small in-memory `IStorageManager`
 *   stub (below) — the same shape a real `MockStorageManager` from
 *   `@stackra/storage/testing` produces, without pulling that package
 *   in for a unit test.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@stackra/container", () => ({
  Injectable: () => (target: unknown) => target,
  Inject: () => () => {},
  Optional: () => () => {},
}));

import { ShortcutCustomizationService } from "../../src/services/shortcut-customization.service";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";
import type { Shortcut } from "../../src/interfaces/shortcut.interface";

/**
 * Minimal in-memory `IStorage` — matches the async contract but is
 * backed by a `Map<string, unknown>` so tests can inspect + seed
 * values without a real driver.
 */
class InMemoryStorage {
  private store = new Map<string, unknown>();

  public async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  public async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  public async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  public snapshot(): Map<string, unknown> {
    return new Map(this.store);
  }

  public seed(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  public clear(): void {
    this.store.clear();
  }
}

/**
 * Minimal in-memory `IStorageManager` — maps instance names to a
 * shared or per-name `InMemoryStorage`.
 */
class InMemoryStorageManager {
  public readonly instances = new Map<string, InMemoryStorage>();

  public instance(name: string): InMemoryStorage {
    let existing = this.instances.get(name);
    if (!existing) {
      existing = new InMemoryStorage();
      this.instances.set(name, existing);
    }
    return existing;
  }
}

/**
 * Mock ShortcutRegistry that simulates the real registry's API.
 */
class MockShortcutRegistry {
  private shortcuts = new Map<string, Shortcut>();

  public get(id: string): Shortcut | undefined {
    return this.shortcuts.get(id);
  }

  public getAll(): Shortcut[] {
    return [...this.shortcuts.values()];
  }

  public registerShortcut(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  /** Helper to seed test data. */
  public seed(shortcuts: Shortcut[]): void {
    for (const s of shortcuts) this.shortcuts.set(s.id, s);
  }
}

/**
 * Await a persist round-trip. `persist()` is `void`-typed on the public
 * API (fire-and-forget), so tests yield a microtask to let it settle.
 */
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("ShortcutCustomizationService", () => {
  let service: ShortcutCustomizationService;
  let registry: MockShortcutRegistry;
  let storage: InMemoryStorageManager;

  const saveShortcut: Shortcut = {
    id: "editor.save",
    description: "Save file",
    combo: { mod: true, key: "s" },
    handler: vi.fn(),
  };

  const copyShortcut: Shortcut = {
    id: "editor.copy",
    description: "Copy selection",
    combo: { mod: true, key: "c" },
    handler: vi.fn(),
  };

  const pasteShortcut: Shortcut = {
    id: "editor.paste",
    description: "Paste",
    combo: { mod: true, key: "v" },
    handler: vi.fn(),
  };

  beforeEach(() => {
    registry = new MockShortcutRegistry();
    registry.seed([saveShortcut, copyShortcut, pasteShortcut]);
    storage = new InMemoryStorageManager();

    // Pass registry + storage manager as the injected dependencies.
    // The service accepts both as constructor args.
    service = new ShortcutCustomizationService(
      registry as unknown as ConstructorParameters<
        typeof ShortcutCustomizationService
      >[0],
      storage as unknown as ConstructorParameters<
        typeof ShortcutCustomizationService
      >[1],
    );
  });

  // ── setCustomCombo ────────────────────────────────────────────────────────

  describe("setCustomCombo", () => {
    it("stores the override in the overrides map", () => {
      const newCombo: KeyCombo = { mod: true, shift: true, key: "s" };
      service.setCustomCombo("editor.save", newCombo);

      expect(service.getOverrides().get("editor.save")).toEqual(newCombo);
    });

    it("applies the override to the registry", () => {
      const newCombo: KeyCombo = { mod: true, shift: true, key: "s" };
      service.setCustomCombo("editor.save", newCombo);

      const updated = registry.get("editor.save");
      expect(updated?.combo).toEqual(newCombo);
    });

    it("persists the override to the storage manager", async () => {
      const newCombo: KeyCombo = { mod: true, shift: true, key: "s" };
      service.setCustomCombo("editor.save", newCombo);
      await flushMicrotasks();

      const stored = storage.instance("localStorage").snapshot().get("kbd:overrides");
      expect(stored).toEqual({ "editor.save": { combo: newCombo } });
    });

    it("stores the original default before overriding", () => {
      const originalCombo = saveShortcut.combo;
      const newCombo: KeyCombo = { mod: true, shift: true, key: "s" };
      service.setCustomCombo("editor.save", newCombo);

      // Reset should restore the original
      service.resetToDefault("editor.save");
      const restored = registry.get("editor.save");
      expect(restored?.combo).toEqual(originalCombo);
    });

    it("supports array of combos", () => {
      const combos: KeyCombo[] = [
        { mod: true, key: "s" },
        { mod: true, shift: true, key: "s" },
      ];
      service.setCustomCombo("editor.save", combos);

      expect(service.getOverrides().get("editor.save")).toEqual(combos);
    });
  });

  // ── resetToDefault ────────────────────────────────────────────────────────

  describe("resetToDefault", () => {
    it("restores the original combo to the registry", () => {
      const originalCombo = saveShortcut.combo;
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      service.resetToDefault("editor.save");

      const restored = registry.get("editor.save");
      expect(restored?.combo).toEqual(originalCombo);
    });

    it("removes the shortcut from overrides", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      service.resetToDefault("editor.save");

      expect(service.getOverrides().has("editor.save")).toBe(false);
    });

    it("persists the removal to the storage manager", async () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      await flushMicrotasks();
      service.resetToDefault("editor.save");
      await flushMicrotasks();

      const stored = storage.instance("localStorage").snapshot().get("kbd:overrides") as
        | Record<string, unknown>
        | undefined;
      expect(stored?.["editor.save"]).toBeUndefined();
    });

    it("does nothing when shortcut has no stored default", () => {
      // Never customized — no default stored.
      service.resetToDefault("nonexistent");
      expect(service.getOverrides().size).toBe(0);
    });
  });

  // ── resetAllToDefaults ────────────────────────────────────────────────────

  describe("resetAllToDefaults", () => {
    it("clears all overrides", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      service.setCustomCombo("editor.copy", { mod: true, shift: true, key: "c" });
      service.resetAllToDefaults();

      expect(service.getOverrides().size).toBe(0);
    });

    it("restores all defaults to the registry", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      service.setCustomCombo("editor.copy", { mod: true, shift: true, key: "c" });
      service.resetAllToDefaults();

      expect(registry.get("editor.save")?.combo).toEqual(saveShortcut.combo);
      expect(registry.get("editor.copy")?.combo).toEqual(copyShortcut.combo);
    });

    it("persists the cleared state to the storage manager", async () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      await flushMicrotasks();
      service.resetAllToDefaults();
      await flushMicrotasks();

      const stored = storage.instance("localStorage").snapshot().get("kbd:overrides") as
        | Record<string, unknown>
        | undefined;
      expect(Object.keys(stored ?? {})).toHaveLength(0);
    });
  });

  // ── checkConflict ─────────────────────────────────────────────────────────

  describe("checkConflict", () => {
    it("detects a conflict with an existing shortcut", () => {
      const conflict = service.checkConflict("editor.save", { mod: true, key: "c" });
      expect(conflict).not.toBeNull();
      expect(conflict?.shortcut.id).toBe("editor.copy");
    });

    it("excludes the shortcut being customized from conflict check", () => {
      const conflict = service.checkConflict("editor.save", { mod: true, key: "s" });
      expect(conflict).toBeNull();
    });

    it("returns null when no conflict exists", () => {
      const conflict = service.checkConflict("editor.save", { mod: true, key: "z" });
      expect(conflict).toBeNull();
    });

    it("detects conflicts with sequence combos", () => {
      const seqShortcut: Shortcut = {
        id: "nav.goto",
        description: "Go to",
        combo: { sequence: ["g", "h"] },
        handler: vi.fn(),
      };
      registry.seed([...registry.getAll(), seqShortcut]);

      const conflict = service.checkConflict("editor.save", { sequence: ["g", "h"] });
      expect(conflict).not.toBeNull();
      expect(conflict?.shortcut.id).toBe("nav.goto");
    });

    it("handles shortcuts with multiple combos", () => {
      const multiShortcut: Shortcut = {
        id: "editor.multi",
        description: "Multi combo",
        combo: [
          { mod: true, key: "m" },
          { mod: true, shift: true, key: "m" },
        ],
        handler: vi.fn(),
      };
      registry.seed([...registry.getAll(), multiShortcut]);

      const conflict = service.checkConflict("editor.save", {
        mod: true,
        shift: true,
        key: "m",
      });
      expect(conflict).not.toBeNull();
      expect(conflict?.shortcut.id).toBe("editor.multi");
    });
  });

  // ── getCombo ──────────────────────────────────────────────────────────────

  describe("getCombo", () => {
    it("returns the override when set", () => {
      const newCombo: KeyCombo = { mod: true, shift: true, key: "s" };
      service.setCustomCombo("editor.save", newCombo);

      expect(service.getCombo("editor.save")).toEqual(newCombo);
    });

    it("returns the default when no override is set (after a prior customization)", () => {
      // The default is stored after first customization of any shortcut
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      service.resetToDefault("editor.save");

      expect(service.getCombo("editor.save")).toEqual(saveShortcut.combo);
    });

    it("returns undefined for unknown shortcuts", () => {
      expect(service.getCombo("nonexistent")).toBeUndefined();
    });
  });

  // ── isCustomized ──────────────────────────────────────────────────────────

  describe("isCustomized", () => {
    it("returns true for customized shortcuts", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      expect(service.isCustomized("editor.save")).toBe(true);
    });

    it("returns false for non-customized shortcuts", () => {
      expect(service.isCustomized("editor.save")).toBe(false);
    });

    it("returns false after reset", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      service.resetToDefault("editor.save");
      expect(service.isCustomized("editor.save")).toBe(false);
    });
  });

  // ── getOverrides ──────────────────────────────────────────────────────────

  describe("getOverrides", () => {
    it("returns all current overrides", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      service.setCustomCombo("editor.copy", { mod: true, shift: true, key: "c" });

      const overrides = service.getOverrides();
      expect(overrides.size).toBe(2);
      expect(overrides.has("editor.save")).toBe(true);
      expect(overrides.has("editor.copy")).toBe(true);
    });

    it("returns empty map when no overrides exist", () => {
      expect(service.getOverrides().size).toBe(0);
    });
  });

  // ── subscribe ─────────────────────────────────────────────────────────────

  describe("subscribe", () => {
    it("notifies listeners on setCustomCombo", () => {
      const listener = vi.fn();
      service.subscribe(listener);

      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("notifies listeners on resetToDefault", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });

      const listener = vi.fn();
      service.subscribe(listener);

      service.resetToDefault("editor.save");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("notifies listeners on resetAllToDefaults", () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });

      const listener = vi.fn();
      service.subscribe(listener);

      service.resetAllToDefaults();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("returns an unsubscribe function", () => {
      const listener = vi.fn();
      const unsub = service.subscribe(listener);

      unsub();
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      expect(listener).not.toHaveBeenCalled();
    });

    it("supports multiple listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.subscribe(listener1);
      service.subscribe(listener2);

      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  // ── onModuleInit (loads persisted overrides) ─────────────────────────────

  describe("onModuleInit", () => {
    it("loads overrides from storage on module init", async () => {
      // Seed storage BEFORE constructing the service under test.
      const seededStorage = new InMemoryStorageManager();
      seededStorage.instance("localStorage").seed("kbd:overrides", {
        "editor.save": { combo: { mod: true, shift: true, key: "s" } },
      });

      const freshRegistry = new MockShortcutRegistry();
      freshRegistry.seed([saveShortcut, copyShortcut, pasteShortcut]);

      const freshService = new ShortcutCustomizationService(
        freshRegistry as unknown as ConstructorParameters<
          typeof ShortcutCustomizationService
        >[0],
        seededStorage as unknown as ConstructorParameters<
          typeof ShortcutCustomizationService
        >[1],
      );

      await freshService.onModuleInit();

      expect(freshService.isCustomized("editor.save")).toBe(true);
    });

    it("applies loaded overrides to the registry", async () => {
      const newCombo: KeyCombo = { mod: true, shift: true, key: "s" };
      const seededStorage = new InMemoryStorageManager();
      seededStorage
        .instance("localStorage")
        .seed("kbd:overrides", { "editor.save": { combo: newCombo } });

      const freshRegistry = new MockShortcutRegistry();
      freshRegistry.seed([saveShortcut, copyShortcut, pasteShortcut]);

      const freshService = new ShortcutCustomizationService(
        freshRegistry as unknown as ConstructorParameters<
          typeof ShortcutCustomizationService
        >[0],
        seededStorage as unknown as ConstructorParameters<
          typeof ShortcutCustomizationService
        >[1],
      );
      await freshService.onModuleInit();

      expect(freshRegistry.get("editor.save")?.combo).toEqual(newCombo);
    });

    it("handles a missing storage manager gracefully (headless test)", async () => {
      const headlessService = new ShortcutCustomizationService(
        registry as unknown as ConstructorParameters<
          typeof ShortcutCustomizationService
        >[0],
      );
      await expect(headlessService.onModuleInit()).resolves.toBeUndefined();
    });

    it("handles an empty storage instance gracefully", async () => {
      // No stored data — `get` returns undefined and the service exits early.
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  // ── persist ───────────────────────────────────────────────────────────────

  describe("persist", () => {
    it("saves overrides in the correct format", async () => {
      const combo1: KeyCombo = { mod: true, shift: true, key: "s" };
      const combo2: KeyCombo = { mod: true, shift: true, key: "c" };
      service.setCustomCombo("editor.save", combo1);
      service.setCustomCombo("editor.copy", combo2);
      await flushMicrotasks();

      const stored = storage.instance("localStorage").snapshot().get("kbd:overrides");
      expect(stored).toEqual({
        "editor.save": { combo: combo1 },
        "editor.copy": { combo: combo2 },
      });
    });

    it("uses the correct storage key", async () => {
      service.setCustomCombo("editor.save", { mod: true, shift: true, key: "s" });
      await flushMicrotasks();

      expect(storage.instance("localStorage").snapshot().has("kbd:overrides")).toBe(true);
    });
  });
});
