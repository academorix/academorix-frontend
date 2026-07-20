/**
 * Unit Tests — isTypingTarget
 *
 * Tests for the isTypingTarget utility which detects when the user
 * is typing into an input field, textarea, or contentEditable element.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect } from "vitest";
import { isTypingTarget } from "../../src/utils/is-typing-target.util";

/**
 * Create a mock KeyboardEvent with a target element.
 */
function createMockEvent(tagName: string, extras?: Partial<HTMLElement>): KeyboardEvent {
  const target = {
    tagName,
    isContentEditable: false,
    getAttribute: () => null,
    ...extras,
  } as unknown as HTMLElement;
  return { target } as unknown as KeyboardEvent;
}

describe("isTypingTarget", () => {
  describe("INPUT elements return true", () => {
    it("returns true for INPUT elements", () => {
      const event = createMockEvent("INPUT");
      expect(isTypingTarget(event)).toBe(true);
    });

    it("returns true for INPUT regardless of type", () => {
      const event = createMockEvent("INPUT", { type: "text" } as Partial<HTMLElement>);
      expect(isTypingTarget(event)).toBe(true);
    });
  });

  describe("TEXTAREA elements return true", () => {
    it("returns true for TEXTAREA elements", () => {
      const event = createMockEvent("TEXTAREA");
      expect(isTypingTarget(event)).toBe(true);
    });
  });

  describe("SELECT elements return true", () => {
    it("returns true for SELECT elements", () => {
      const event = createMockEvent("SELECT");
      expect(isTypingTarget(event)).toBe(true);
    });
  });

  describe("contentEditable elements return true", () => {
    it("returns true for contentEditable elements", () => {
      const event = createMockEvent("DIV", { isContentEditable: true } as Partial<HTMLElement>);
      expect(isTypingTarget(event)).toBe(true);
    });

    it("returns true for contentEditable span", () => {
      const event = createMockEvent("SPAN", { isContentEditable: true } as Partial<HTMLElement>);
      expect(isTypingTarget(event)).toBe(true);
    });
  });

  describe('role="textbox" elements return true', () => {
    it("returns true for elements with role=textbox", () => {
      const event = createMockEvent("DIV", {
        getAttribute: (attr: string) => (attr === "role" ? "textbox" : null),
      } as unknown as Partial<HTMLElement>);
      expect(isTypingTarget(event)).toBe(true);
    });

    it("returns true for role=textbox case-insensitive", () => {
      const event = createMockEvent("DIV", {
        getAttribute: (attr: string) => (attr === "role" ? "Textbox" : null),
      } as unknown as Partial<HTMLElement>);
      expect(isTypingTarget(event)).toBe(true);
    });
  });

  describe("regular DIV elements return false", () => {
    it("returns false for plain DIV elements", () => {
      const event = createMockEvent("DIV");
      expect(isTypingTarget(event)).toBe(false);
    });

    it("returns false for BUTTON elements", () => {
      const event = createMockEvent("BUTTON");
      expect(isTypingTarget(event)).toBe(false);
    });

    it("returns false for SECTION elements", () => {
      const event = createMockEvent("SECTION");
      expect(isTypingTarget(event)).toBe(false);
    });

    it("returns false for ARTICLE elements", () => {
      const event = createMockEvent("ARTICLE");
      expect(isTypingTarget(event)).toBe(false);
    });

    it("returns false for elements with non-textbox roles", () => {
      const event = createMockEvent("DIV", {
        getAttribute: (attr: string) => (attr === "role" ? "button" : null),
      } as unknown as Partial<HTMLElement>);
      expect(isTypingTarget(event)).toBe(false);
    });
  });

  describe("null target returns false", () => {
    it("returns false when event target is null", () => {
      const event = { target: null } as unknown as KeyboardEvent;
      expect(isTypingTarget(event)).toBe(false);
    });

    it("returns false when event target is undefined", () => {
      const event = { target: undefined } as unknown as KeyboardEvent;
      expect(isTypingTarget(event)).toBe(false);
    });
  });
});
