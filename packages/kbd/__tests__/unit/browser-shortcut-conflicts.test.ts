/**
 * Unit Tests — Browser Shortcut Conflicts
 *
 * Tests for comboToCanonical and isReservedBrowserCombo utilities
 * which detect conflicts with browser/OS reserved keyboard shortcuts.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect } from "vitest";
import {
  comboToCanonical,
  isReservedBrowserCombo,
  RESERVED_BROWSER_COMBOS,
} from "../../src/utils/browser-shortcut-conflicts.util";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";

describe("comboToCanonical", () => {
  describe("modifier combos", () => {
    it("generates canonical string for mod+key", () => {
      const combo: KeyCombo = { mod: true, key: "t" };
      expect(comboToCanonical(combo)).toBe("mod+t");
    });

    it("generates canonical string for mod+shift+key", () => {
      const combo: KeyCombo = { mod: true, shift: true, key: "t" };
      expect(comboToCanonical(combo)).toBe("mod+shift+t");
    });

    it("generates canonical string for alt+key", () => {
      const combo: KeyCombo = { alt: true, key: "f4" };
      expect(comboToCanonical(combo)).toBe("alt+f4");
    });

    it("generates canonical string for ctrl+key (without mod)", () => {
      const combo: KeyCombo = { ctrl: true, key: "tab" };
      expect(comboToCanonical(combo)).toBe("ctrl+tab");
    });

    it("generates canonical string for ctrl+shift+key", () => {
      const combo: KeyCombo = { ctrl: true, shift: true, key: "tab" };
      expect(comboToCanonical(combo)).toBe("ctrl+shift+tab");
    });

    it("treats meta as mod in canonical form", () => {
      const combo: KeyCombo = { meta: true, key: "w" };
      expect(comboToCanonical(combo)).toBe("mod+w");
    });

    it("suppresses ctrl when mod is set", () => {
      const combo: KeyCombo = { mod: true, ctrl: true, key: "k" };
      expect(comboToCanonical(combo)).toBe("mod+k");
    });

    it("generates canonical string for plain key", () => {
      const combo: KeyCombo = { key: "f11" };
      expect(comboToCanonical(combo)).toBe("f11");
    });

    it("lowercases the key", () => {
      const combo: KeyCombo = { mod: true, key: "K" };
      expect(comboToCanonical(combo)).toBe("mod+k");
    });
  });

  describe("sequence combos", () => {
    it("generates seq: prefix for sequence combos", () => {
      const combo: KeyCombo = { sequence: ["g", "p"] };
      expect(comboToCanonical(combo)).toBe("seq:g p");
    });

    it("lowercases sequence keys", () => {
      const combo: KeyCombo = { sequence: ["G", "P"] };
      expect(comboToCanonical(combo)).toBe("seq:g p");
    });

    it("handles multi-key sequences", () => {
      const combo: KeyCombo = { sequence: ["g", "i", "t"] };
      expect(comboToCanonical(combo)).toBe("seq:g i t");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty combo", () => {
      const combo: KeyCombo = {};
      expect(comboToCanonical(combo)).toBe("");
    });

    it("handles combo with only modifiers (no key)", () => {
      const combo: KeyCombo = { mod: true, shift: true };
      expect(comboToCanonical(combo)).toBe("mod+shift");
    });
  });
});

describe("isReservedBrowserCombo", () => {
  describe("reserved combo detection", () => {
    it("detects mod+t as reserved", () => {
      const combo: KeyCombo = { mod: true, key: "t" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects mod+w as reserved", () => {
      const combo: KeyCombo = { mod: true, key: "w" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects mod+n as reserved", () => {
      const combo: KeyCombo = { mod: true, key: "n" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects mod+q as reserved", () => {
      const combo: KeyCombo = { mod: true, key: "q" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects mod+l as reserved", () => {
      const combo: KeyCombo = { mod: true, key: "l" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects mod+shift+t as reserved", () => {
      const combo: KeyCombo = { mod: true, shift: true, key: "t" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects alt+f4 as reserved", () => {
      const combo: KeyCombo = { alt: true, key: "f4" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects f11 as reserved", () => {
      const combo: KeyCombo = { key: "f11" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects f12 as reserved", () => {
      const combo: KeyCombo = { key: "f12" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects ctrl+tab as reserved", () => {
      const combo: KeyCombo = { ctrl: true, key: "tab" };
      expect(isReservedBrowserCombo(combo)).toBe(true);
    });

    it("detects mod+number keys as reserved", () => {
      for (let i = 1; i <= 9; i++) {
        const combo: KeyCombo = { mod: true, key: String(i) };
        expect(isReservedBrowserCombo(combo)).toBe(true);
      }
    });
  });

  describe("non-reserved combos return false", () => {
    it("returns false for mod+k", () => {
      const combo: KeyCombo = { mod: true, key: "k" };
      expect(isReservedBrowserCombo(combo)).toBe(false);
    });

    it("returns false for mod+shift+p", () => {
      const combo: KeyCombo = { mod: true, shift: true, key: "p" };
      expect(isReservedBrowserCombo(combo)).toBe(false);
    });

    it("returns false for plain escape", () => {
      const combo: KeyCombo = { key: "escape" };
      expect(isReservedBrowserCombo(combo)).toBe(false);
    });

    it("returns false for sequence combos", () => {
      const combo: KeyCombo = { sequence: ["g", "p"] };
      expect(isReservedBrowserCombo(combo)).toBe(false);
    });
  });

  describe("extra reserved keys parameter", () => {
    it("detects combos in the extra list", () => {
      const combo: KeyCombo = { mod: true, key: "k" };
      expect(isReservedBrowserCombo(combo, ["mod+k"])).toBe(true);
    });

    it("does not affect detection of built-in reserved combos", () => {
      const combo: KeyCombo = { mod: true, key: "t" };
      expect(isReservedBrowserCombo(combo, ["mod+k"])).toBe(true);
    });

    it("returns false when combo is not in either list", () => {
      const combo: KeyCombo = { mod: true, key: "j" };
      expect(isReservedBrowserCombo(combo, ["mod+k"])).toBe(false);
    });
  });

  describe("RESERVED_BROWSER_COMBOS list", () => {
    // The reserved list is exported as a `Set<string>` (not a frozen
    // array), because `.has(canonical)` is the hot-path lookup inside
    // `isReservedBrowserCombo`. We assert its `Set` identity + non-
    // emptiness rather than array-shape invariants.

    it("is a Set", () => {
      expect(RESERVED_BROWSER_COMBOS).toBeInstanceOf(Set);
    });

    it("contains expected entries", () => {
      expect(RESERVED_BROWSER_COMBOS.has("mod+t")).toBe(true);
      expect(RESERVED_BROWSER_COMBOS.has("mod+w")).toBe(true);
      expect(RESERVED_BROWSER_COMBOS.has("alt+f4")).toBe(true);
      expect(RESERVED_BROWSER_COMBOS.has("f11")).toBe(true);
      expect(RESERVED_BROWSER_COMBOS.has("f12")).toBe(true);
    });

    it("is a non-empty Set", () => {
      expect(RESERVED_BROWSER_COMBOS.size).toBeGreaterThan(0);
    });
  });
});
