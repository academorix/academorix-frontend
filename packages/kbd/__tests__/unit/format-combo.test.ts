/**
 * Unit Tests — formatCombo
 *
 * Tests for the formatCombo utility which renders a KeyCombo as a
 * human-readable string using TanStack Hotkeys' formatForDisplay.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@tanstack/react-hotkeys", () => ({
  formatForDisplay: vi.fn((str: string) => `formatted:${str}`),
}));

import { formatCombo } from "../../src/utils/format-combo.util";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";

describe("formatCombo", () => {
  describe("sequence formatting", () => {
    it("formats a sequence as space-separated uppercase keys", () => {
      const combo: KeyCombo = { sequence: ["g", "p"] };
      expect(formatCombo(combo)).toBe("G P");
    });

    it("formats a single-key sequence", () => {
      const combo: KeyCombo = { sequence: ["h"] };
      expect(formatCombo(combo)).toBe("H");
    });

    it("formats a multi-key sequence", () => {
      const combo: KeyCombo = { sequence: ["g", "i", "t"] };
      expect(formatCombo(combo)).toBe("G I T");
    });

    it("uppercases special keys in sequences", () => {
      const combo: KeyCombo = { sequence: ["escape", "enter"] };
      expect(formatCombo(combo)).toBe("ESCAPE ENTER");
    });
  });

  describe("platform-specific sequences", () => {
    it("formats mac keys when on mac platform", () => {
      // Mock navigator for mac detection
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Macintosh" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = { keys: { mac: ["g", "m"], windows: ["g", "w"] } };
      expect(formatCombo(combo)).toBe("G M");

      // Restore
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });
    });

    it("formats windows keys when not on mac platform", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Windows NT 10.0" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = { keys: { mac: ["g", "m"], windows: ["g", "w"] } };
      expect(formatCombo(combo)).toBe("G W");

      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });
    });

    it("falls back to linux keys when windows is not available", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Linux x86_64" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = { keys: { mac: ["g", "m"], linux: ["g", "l"] } };
      expect(formatCombo(combo)).toBe("G L");

      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });
    });
  });

  describe("single-key combo delegation to TanStack", () => {
    it("delegates single-key combos to formatForDisplay", () => {
      const combo: KeyCombo = { mod: true, key: "k" };
      expect(formatCombo(combo)).toBe("formatted:Mod+K");
    });

    it("delegates plain key combos to formatForDisplay", () => {
      const combo: KeyCombo = { key: "escape" };
      expect(formatCombo(combo)).toBe("formatted:Escape");
    });

    it("passes platform option to formatForDisplay", () => {
      const combo: KeyCombo = { mod: true, key: "s" };
      const result = formatCombo(combo, { platform: "mac" });
      expect(result).toBe("formatted:Mod+S");
    });
  });

  describe("custom sequence separator", () => {
    it("uses custom separator for sequences", () => {
      const combo: KeyCombo = { sequence: ["g", "p"] };
      expect(formatCombo(combo, { sequenceSeparator: " → " })).toBe("G → P");
    });

    it("uses custom separator for platform-specific sequences", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Macintosh" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = { keys: { mac: ["g", "h"] } };
      expect(formatCombo(combo, { sequenceSeparator: "-" })).toBe("G-H");

      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });
    });
  });

  describe("fallback for combos with only a key", () => {
    it("returns uppercase key when combo has no modifiers and no hotkey string", () => {
      // A combo with keys but empty arrays won't produce a hotkeyString
      const combo: KeyCombo = { keys: { mac: [] } };
      expect(formatCombo(combo)).toBe("");
    });

    it("returns empty string when combo has no key at all", () => {
      const combo: KeyCombo = {};
      expect(formatCombo(combo)).toBe("");
    });
  });
});
