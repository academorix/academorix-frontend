/**
 * Unit Tests — TanStack Adapter Utilities
 *
 * Tests for comboToHotkeyString, hotkeyStringToCombo, and sequenceToKeys
 * which convert between KeyCombo format and TanStack Hotkeys string format.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect } from "vitest";
import {
  comboToHotkeyString,
  hotkeyStringToCombo,
  sequenceToKeys,
} from "../../src/utils/tanstack-adapter.util";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";

describe("comboToHotkeyString", () => {
  describe("single key combos", () => {
    it("converts mod+key to Mod+Key format", () => {
      const combo: KeyCombo = { mod: true, key: "k" };
      expect(comboToHotkeyString(combo)).toBe("Mod+K");
    });

    it("converts a plain key to uppercase", () => {
      const combo: KeyCombo = { key: "a" };
      expect(comboToHotkeyString(combo)).toBe("A");
    });

    it("converts alt+key", () => {
      const combo: KeyCombo = { alt: true, key: "n" };
      expect(comboToHotkeyString(combo)).toBe("Alt+N");
    });

    it("converts shift+key", () => {
      const combo: KeyCombo = { shift: true, key: "p" };
      expect(comboToHotkeyString(combo)).toBe("Shift+P");
    });

    it("converts ctrl+key (without mod)", () => {
      const combo: KeyCombo = { ctrl: true, key: "c" };
      expect(comboToHotkeyString(combo)).toBe("Control+C");
    });

    it("converts meta+key (without mod)", () => {
      const combo: KeyCombo = { meta: true, key: "v" };
      expect(comboToHotkeyString(combo)).toBe("Meta+V");
    });
  });

  describe("modifier combinations", () => {
    it("converts mod+shift+key", () => {
      const combo: KeyCombo = { mod: true, shift: true, key: "p" };
      expect(comboToHotkeyString(combo)).toBe("Mod+Shift+P");
    });

    it("converts mod+alt+key", () => {
      const combo: KeyCombo = { mod: true, alt: true, key: "d" };
      expect(comboToHotkeyString(combo)).toBe("Mod+Alt+D");
    });

    it("converts mod+shift+alt+key", () => {
      const combo: KeyCombo = { mod: true, shift: true, alt: true, key: "x" };
      expect(comboToHotkeyString(combo)).toBe("Mod+Alt+Shift+X");
    });

    it("suppresses ctrl when mod is set", () => {
      const combo: KeyCombo = { mod: true, ctrl: true, key: "k" };
      expect(comboToHotkeyString(combo)).toBe("Mod+K");
    });

    it("suppresses meta when mod is set", () => {
      const combo: KeyCombo = { mod: true, meta: true, key: "k" };
      expect(comboToHotkeyString(combo)).toBe("Mod+K");
    });
  });

  describe("sequence combos return undefined", () => {
    it("returns undefined for sequence combos", () => {
      const combo: KeyCombo = { sequence: ["g", "p"] };
      expect(comboToHotkeyString(combo)).toBeUndefined();
    });

    it("returns undefined for platform-specific key combos", () => {
      const combo: KeyCombo = { keys: { mac: ["g", "h"] } };
      expect(comboToHotkeyString(combo)).toBeUndefined();
    });

    it("returns undefined when no key is set", () => {
      const combo: KeyCombo = { mod: true };
      expect(comboToHotkeyString(combo)).toBeUndefined();
    });
  });

  describe("special key normalization", () => {
    it("normalizes escape to Escape", () => {
      const combo: KeyCombo = { key: "escape" };
      expect(comboToHotkeyString(combo)).toBe("Escape");
    });

    it("normalizes esc to Escape", () => {
      const combo: KeyCombo = { key: "esc" };
      expect(comboToHotkeyString(combo)).toBe("Escape");
    });

    it("normalizes space to Space", () => {
      const combo: KeyCombo = { key: "space" };
      expect(comboToHotkeyString(combo)).toBe("Space");
    });

    it("normalizes enter to Enter", () => {
      const combo: KeyCombo = { key: "enter" };
      expect(comboToHotkeyString(combo)).toBe("Enter");
    });

    it("normalizes tab to Tab", () => {
      const combo: KeyCombo = { key: "tab" };
      expect(comboToHotkeyString(combo)).toBe("Tab");
    });

    it("normalizes arrow keys", () => {
      expect(comboToHotkeyString({ key: "up" })).toBe("ArrowUp");
      expect(comboToHotkeyString({ key: "down" })).toBe("ArrowDown");
      expect(comboToHotkeyString({ key: "left" })).toBe("ArrowLeft");
      expect(comboToHotkeyString({ key: "right" })).toBe("ArrowRight");
    });

    it("normalizes function keys to uppercase", () => {
      const combo: KeyCombo = { key: "f1" };
      expect(comboToHotkeyString(combo)).toBe("F1");
    });

    it("normalizes delete aliases", () => {
      expect(comboToHotkeyString({ key: "del" })).toBe("Delete");
      expect(comboToHotkeyString({ key: "delete" })).toBe("Delete");
    });
  });

  describe("round-trip conversion", () => {
    it("converts combo → string → combo preserving mod", () => {
      const original: KeyCombo = { mod: true, key: "k" };
      const str = comboToHotkeyString(original)!;
      const restored = hotkeyStringToCombo(str);
      expect(restored.mod).toBe(true);
      expect(restored.key).toBe("k");
    });

    it("converts combo → string → combo preserving shift", () => {
      const original: KeyCombo = { mod: true, shift: true, key: "p" };
      const str = comboToHotkeyString(original)!;
      const restored = hotkeyStringToCombo(str);
      expect(restored.mod).toBe(true);
      expect(restored.shift).toBe(true);
      expect(restored.key).toBe("p");
    });

    it("converts combo → string → combo preserving alt", () => {
      const original: KeyCombo = { alt: true, key: "n" };
      const str = comboToHotkeyString(original)!;
      const restored = hotkeyStringToCombo(str);
      expect(restored.alt).toBe(true);
      expect(restored.key).toBe("n");
    });
  });
});

describe("hotkeyStringToCombo", () => {
  describe("modifier parsing", () => {
    it("parses Mod modifier", () => {
      const combo = hotkeyStringToCombo("Mod+K");
      expect(combo.mod).toBe(true);
      expect(combo.key).toBe("k");
    });

    it("parses Control modifier", () => {
      const combo = hotkeyStringToCombo("Control+C");
      expect(combo.ctrl).toBe(true);
      expect(combo.key).toBe("c");
    });

    it("parses Ctrl alias", () => {
      const combo = hotkeyStringToCombo("Ctrl+X");
      expect(combo.ctrl).toBe(true);
      expect(combo.key).toBe("x");
    });

    it("parses Meta modifier", () => {
      const combo = hotkeyStringToCombo("Meta+V");
      expect(combo.meta).toBe(true);
      expect(combo.key).toBe("v");
    });

    it("parses Command alias", () => {
      const combo = hotkeyStringToCombo("Command+Z");
      expect(combo.meta).toBe(true);
      expect(combo.key).toBe("z");
    });

    it("parses Cmd alias", () => {
      const combo = hotkeyStringToCombo("Cmd+A");
      expect(combo.meta).toBe(true);
      expect(combo.key).toBe("a");
    });

    it("parses Alt modifier", () => {
      const combo = hotkeyStringToCombo("Alt+N");
      expect(combo.alt).toBe(true);
      expect(combo.key).toBe("n");
    });

    it("parses Option alias", () => {
      const combo = hotkeyStringToCombo("Option+P");
      expect(combo.alt).toBe(true);
      expect(combo.key).toBe("p");
    });

    it("parses Shift modifier", () => {
      const combo = hotkeyStringToCombo("Shift+Tab");
      expect(combo.shift).toBe(true);
      expect(combo.key).toBe("tab");
    });
  });

  describe("combined modifiers", () => {
    it("parses multiple modifiers", () => {
      const combo = hotkeyStringToCombo("Mod+Shift+Alt+K");
      expect(combo.mod).toBe(true);
      expect(combo.shift).toBe(true);
      expect(combo.alt).toBe(true);
      expect(combo.key).toBe("k");
    });
  });

  describe("plain keys", () => {
    it("parses a single key without modifiers", () => {
      const combo = hotkeyStringToCombo("Escape");
      expect(combo.key).toBe("escape");
      expect(combo.mod).toBeUndefined();
    });

    it("parses a single letter key", () => {
      const combo = hotkeyStringToCombo("K");
      expect(combo.key).toBe("k");
    });
  });
});

describe("sequenceToKeys", () => {
  it("normalizes single-letter keys to uppercase", () => {
    expect(sequenceToKeys(["g", "p"])).toEqual(["G", "P"]);
  });

  it("normalizes special keys", () => {
    expect(sequenceToKeys(["escape"])).toEqual(["Escape"]);
  });

  it("normalizes mixed keys", () => {
    expect(sequenceToKeys(["g", "enter", "a"])).toEqual(["G", "Enter", "A"]);
  });

  it("handles empty array", () => {
    expect(sequenceToKeys([])).toEqual([]);
  });

  it("normalizes arrow key aliases", () => {
    expect(sequenceToKeys(["up", "down"])).toEqual(["ArrowUp", "ArrowDown"]);
  });
});
