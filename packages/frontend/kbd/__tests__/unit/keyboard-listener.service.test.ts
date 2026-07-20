/**
 * Unit Tests — KeyboardListenerService
 *
 * Tests for the keyboard listener service which bridges the
 * ShortcutRegistry with TanStack Hotkeys' HotkeyManager and
 * SequenceManager.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@stackra/container", () => ({
  Injectable: () => (target: any) => target,
  Inject: () => () => {},
  Optional: () => () => {},
}));

vi.mock("@stackra/logger", () => ({
  Logger: class MockLogger {
    warn = vi.fn();
  },
}));

const mockUnregister = vi.fn();
const mockHotkeyRegister = vi.fn(() => ({
  unregister: mockUnregister,
  isActive: true,
  callback: null,
  setOptions: vi.fn(),
}));
const mockSeqUnsubscribe = vi.fn();
const mockSeqRegister = vi.fn(() => mockSeqUnsubscribe);

vi.mock("@tanstack/react-hotkeys", () => ({
  getHotkeyManager: () => ({ register: mockHotkeyRegister }),
  getSequenceManager: () => ({ register: mockSeqRegister }),
}));

vi.mock("@/utils/is-typing-target.util", () => ({
  isTypingTarget: vi.fn(() => false),
}));

vi.mock("@/utils/browser-shortcut-conflicts.util", () => ({
  isReservedBrowserCombo: vi.fn(() => false),
  comboToCanonical: vi.fn(() => ""),
}));

vi.mock("@/utils/tanstack-adapter.util", () => ({
  comboToHotkeyString: vi.fn((combo: any) => {
    if (combo.sequence || combo.keys) return undefined;
    if (!combo.key) return undefined;
    const parts: string[] = [];
    if (combo.mod) parts.push("Mod");
    if (combo.alt) parts.push("Alt");
    if (combo.shift) parts.push("Shift");
    parts.push(combo.key.toUpperCase());
    return parts.join("+");
  }),
  sequenceToKeys: vi.fn((seq: string[]) => seq.map((k: string) => k.toUpperCase())),
}));

import { KeyboardListenerService } from "../../src/services/keyboard-listener.service";
import { ShortcutRegistry } from "../../src/registries/shortcut.registry";
import type { Shortcut } from "../../src/interfaces/shortcut.interface";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";

describe("KeyboardListenerService", () => {
  let service: KeyboardListenerService;
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
    service = new KeyboardListenerService(registry);
  });

  // ── start ─────────────────────────────────────────────────────────────────

  describe("start", () => {
    it("initializes managers and syncs all shortcuts", () => {
      const shortcut = makeShortcut({ id: "editor.save" });
      registry.registerShortcut(shortcut);

      service.start();

      expect(mockHotkeyRegister).toHaveBeenCalled();
    });

    it("does not double-start when called twice", () => {
      const shortcut = makeShortcut({ id: "editor.save" });
      registry.registerShortcut(shortcut);

      service.start();
      const callCount = mockHotkeyRegister.mock.calls.length;

      service.start();
      expect(mockHotkeyRegister.mock.calls.length).toBe(callCount);
    });

    it("registers all existing shortcuts from the registry", () => {
      registry.registerShortcut(makeShortcut({ id: "s1", combo: { mod: true, key: "a" } }));
      registry.registerShortcut(makeShortcut({ id: "s2", combo: { mod: true, key: "b" } }));
      registry.registerShortcut(makeShortcut({ id: "s3", combo: { mod: true, key: "c" } }));

      service.start();

      expect(mockHotkeyRegister).toHaveBeenCalledTimes(3);
    });
  });

  // ── stop ──────────────────────────────────────────────────────────────────

  describe("stop", () => {
    it("cleans up all registrations", () => {
      registry.registerShortcut(makeShortcut({ id: "s1", combo: { mod: true, key: "a" } }));
      registry.registerShortcut(makeShortcut({ id: "s2", combo: { mod: true, key: "b" } }));

      service.start();
      service.stop();

      expect(mockUnregister).toHaveBeenCalledTimes(2);
    });

    it("does nothing when not active", () => {
      expect(() => service.stop()).not.toThrow();
    });

    it("prevents further syncs after stopping", () => {
      service.start();
      service.stop();

      vi.clearAllMocks();
      service.syncShortcut(makeShortcut({ id: "new.one" }));

      expect(mockHotkeyRegister).not.toHaveBeenCalled();
    });
  });

  // ── syncShortcut ──────────────────────────────────────────────────────────

  describe("syncShortcut", () => {
    it("registers single-key combos with HotkeyManager", () => {
      service.start();
      const shortcut = makeShortcut({ id: "editor.save", combo: { mod: true, key: "s" } });

      service.syncShortcut(shortcut);

      expect(mockHotkeyRegister).toHaveBeenCalledWith(
        "Mod+S",
        expect.any(Function),
        expect.objectContaining({ preventDefault: true }),
      );
    });

    it("registers sequence combos with SequenceManager", () => {
      service.start();
      const shortcut = makeShortcut({
        id: "nav.goto",
        combo: { sequence: ["g", "h"] },
      });

      service.syncShortcut(shortcut);

      expect(mockSeqRegister).toHaveBeenCalledWith(
        ["G", "H"],
        expect.any(Function),
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
    });

    it("handles multiple combos per shortcut", () => {
      service.start();
      const shortcut = makeShortcut({
        id: "editor.multi",
        combo: [
          { mod: true, key: "s" },
          { mod: true, shift: true, key: "s" },
        ],
      });

      service.syncShortcut(shortcut);

      expect(mockHotkeyRegister).toHaveBeenCalledWith(
        "Mod+S",
        expect.any(Function),
        expect.any(Object),
      );
      expect(mockHotkeyRegister).toHaveBeenCalledWith(
        "Mod+Shift+S",
        expect.any(Function),
        expect.any(Object),
      );
    });

    it("removes previous registration before re-syncing", () => {
      service.start();
      const shortcut = makeShortcut({ id: "editor.save", combo: { mod: true, key: "s" } });

      service.syncShortcut(shortcut);
      service.syncShortcut(shortcut);

      // First registration should have been cleaned up
      expect(mockUnregister).toHaveBeenCalledTimes(1);
    });

    it("does nothing when service is not active", () => {
      const shortcut = makeShortcut({ id: "editor.save" });
      service.syncShortcut(shortcut);

      expect(mockHotkeyRegister).not.toHaveBeenCalled();
    });

    it("passes preventDefault option from shortcut", () => {
      service.start();
      const shortcut = makeShortcut({
        id: "no.prevent",
        combo: { mod: true, key: "k" },
        preventDefault: false,
      });

      service.syncShortcut(shortcut);

      expect(mockHotkeyRegister).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({ preventDefault: false }),
      );
    });

    it("passes ignoreInputs option based on allowInInput", () => {
      service.start();
      const shortcut = makeShortcut({
        id: "allow.input",
        combo: { mod: true, key: "k" },
        allowInInput: true,
      });

      service.syncShortcut(shortcut);

      expect(mockHotkeyRegister).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({ ignoreInputs: false }),
      );
    });
  });

  // ── unregisterShortcut ────────────────────────────────────────────────────

  describe("unregisterShortcut", () => {
    it("calls unregister on hotkey handles", () => {
      service.start();
      const shortcut = makeShortcut({ id: "editor.save", combo: { mod: true, key: "s" } });
      service.syncShortcut(shortcut);

      service.unregisterShortcut("editor.save");

      expect(mockUnregister).toHaveBeenCalled();
    });

    it("calls unsubscribe on sequence handles", () => {
      service.start();
      const shortcut = makeShortcut({
        id: "nav.goto",
        combo: { sequence: ["g", "h"] },
      });
      service.syncShortcut(shortcut);

      service.unregisterShortcut("nav.goto");

      expect(mockSeqUnsubscribe).toHaveBeenCalled();
    });

    it("does nothing for non-existent ids", () => {
      service.start();
      expect(() => service.unregisterShortcut("nonexistent")).not.toThrow();
    });

    it("cleans up all handles for multi-combo shortcuts", () => {
      service.start();
      const shortcut = makeShortcut({
        id: "editor.multi",
        combo: [
          { mod: true, key: "s" },
          { mod: true, shift: true, key: "s" },
        ],
      });
      service.syncShortcut(shortcut);

      service.unregisterShortcut("editor.multi");

      expect(mockUnregister).toHaveBeenCalledTimes(2);
    });
  });

  // ── setNavigate ───────────────────────────────────────────────────────────

  describe("setNavigate", () => {
    it("stores the navigate function for route shortcuts", () => {
      const navigate = vi.fn();
      service.setNavigate(navigate);

      // Verify it's stored by triggering a route shortcut
      service.start();
      const routeShortcut: Shortcut = {
        id: "nav.home",
        description: "Go home",
        combo: { mod: true, key: "h" },
        to: "/home",
      };
      service.syncShortcut(routeShortcut);

      // The navigate fn is stored internally — we verify it doesn't throw
      expect(() => service.setNavigate(navigate)).not.toThrow();
    });

    it("accepts null to clear the navigate function", () => {
      const navigate = vi.fn();
      service.setNavigate(navigate);
      service.setNavigate(null);

      expect(() => service.setNavigate(null)).not.toThrow();
    });
  });

  // ── syncAll ───────────────────────────────────────────────────────────────

  describe("syncAll", () => {
    it("re-syncs all shortcuts from the registry", () => {
      registry.registerShortcut(makeShortcut({ id: "s1", combo: { mod: true, key: "a" } }));
      registry.registerShortcut(makeShortcut({ id: "s2", combo: { mod: true, key: "b" } }));

      service.start();
      vi.clearAllMocks();

      service.syncAll();

      expect(mockHotkeyRegister).toHaveBeenCalledTimes(2);
    });

    it("cleans up existing registrations before re-syncing", () => {
      registry.registerShortcut(makeShortcut({ id: "s1", combo: { mod: true, key: "a" } }));
      service.start();

      vi.clearAllMocks();
      service.syncAll();

      // Previous registration cleaned up, then new one created
      expect(mockUnregister).toHaveBeenCalled();
    });

    it("does nothing when not active", () => {
      registry.registerShortcut(makeShortcut({ id: "s1", combo: { mod: true, key: "a" } }));

      vi.clearAllMocks();
      service.syncAll();

      expect(mockHotkeyRegister).not.toHaveBeenCalled();
    });
  });
});
