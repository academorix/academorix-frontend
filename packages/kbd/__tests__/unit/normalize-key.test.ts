/**
 * Unit Tests — normalizeKey
 *
 * Tests for the normalizeKey utility which coerces KeyboardEvent.key
 * values into stable lowercase tokens.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect } from "vitest";
import { normalizeKey } from "../../src/utils/normalize-key.util";

describe("normalizeKey", () => {
  describe("space aliases", () => {
    it('normalizes " " to "space"', () => {
      expect(normalizeKey(" ")).toBe("space");
    });

    it('normalizes "spacebar" to "space"', () => {
      expect(normalizeKey("spacebar")).toBe("space");
    });

    it('normalizes "Spacebar" to "space" (case-insensitive)', () => {
      expect(normalizeKey("Spacebar")).toBe("space");
    });
  });

  describe("escape aliases", () => {
    it('normalizes "esc" to "escape"', () => {
      expect(normalizeKey("esc")).toBe("escape");
    });

    it('normalizes "Esc" to "escape"', () => {
      expect(normalizeKey("Esc")).toBe("escape");
    });

    it('normalizes "Escape" to "escape"', () => {
      expect(normalizeKey("Escape")).toBe("escape");
    });

    it('normalizes "ESC" to "escape"', () => {
      expect(normalizeKey("ESC")).toBe("escape");
    });
  });

  describe("arrow key aliases", () => {
    it('normalizes "arrowup" to "up"', () => {
      expect(normalizeKey("arrowup")).toBe("up");
    });

    it('normalizes "ArrowUp" to "up"', () => {
      expect(normalizeKey("ArrowUp")).toBe("up");
    });

    it('normalizes "arrowdown" to "down"', () => {
      expect(normalizeKey("arrowdown")).toBe("down");
    });

    it('normalizes "ArrowDown" to "down"', () => {
      expect(normalizeKey("ArrowDown")).toBe("down");
    });

    it('normalizes "arrowleft" to "left"', () => {
      expect(normalizeKey("arrowleft")).toBe("left");
    });

    it('normalizes "ArrowLeft" to "left"', () => {
      expect(normalizeKey("ArrowLeft")).toBe("left");
    });

    it('normalizes "arrowright" to "right"', () => {
      expect(normalizeKey("arrowright")).toBe("right");
    });

    it('normalizes "ArrowRight" to "right"', () => {
      expect(normalizeKey("ArrowRight")).toBe("right");
    });
  });

  describe("other aliases", () => {
    it('normalizes "return" to "enter"', () => {
      expect(normalizeKey("return")).toBe("enter");
    });

    it('normalizes "Return" to "enter"', () => {
      expect(normalizeKey("Return")).toBe("enter");
    });

    it('normalizes "del" to "delete"', () => {
      expect(normalizeKey("del")).toBe("delete");
    });

    it('normalizes "Del" to "delete"', () => {
      expect(normalizeKey("Del")).toBe("delete");
    });
  });

  describe("regular keys pass through lowercase", () => {
    it("lowercases single letter keys", () => {
      expect(normalizeKey("A")).toBe("a");
      expect(normalizeKey("Z")).toBe("z");
      expect(normalizeKey("k")).toBe("k");
    });

    it("lowercases multi-character keys", () => {
      expect(normalizeKey("Enter")).toBe("enter");
      expect(normalizeKey("Tab")).toBe("tab");
      expect(normalizeKey("Backspace")).toBe("backspace");
    });

    it("passes through already-lowercase keys", () => {
      expect(normalizeKey("a")).toBe("a");
      expect(normalizeKey("enter")).toBe("enter");
      expect(normalizeKey("tab")).toBe("tab");
    });

    it("handles number keys", () => {
      expect(normalizeKey("1")).toBe("1");
      expect(normalizeKey("9")).toBe("9");
    });

    it("handles function keys", () => {
      expect(normalizeKey("F1")).toBe("f1");
      expect(normalizeKey("F12")).toBe("f12");
    });

    it("handles special characters", () => {
      expect(normalizeKey("/")).toBe("/");
      expect(normalizeKey(".")).toBe(".");
      expect(normalizeKey(",")).toBe(",");
    });
  });

  describe("case insensitivity", () => {
    it("normalizes regardless of input casing", () => {
      expect(normalizeKey("SPACEBAR")).toBe("space");
      expect(normalizeKey("ARROWUP")).toBe("up");
      expect(normalizeKey("ESCAPE")).toBe("escape");
      expect(normalizeKey("RETURN")).toBe("enter");
      expect(normalizeKey("DEL")).toBe("delete");
    });

    it("handles mixed case", () => {
      expect(normalizeKey("SpaceBar")).toBe("space");
      expect(normalizeKey("ArrowUp")).toBe("up");
    });
  });
});
