/**
 * Unit Tests — matchCombo
 *
 * Tests for the matchCombo utility which compares a KeyCombo against
 * a native KeyboardEvent, handling platform-aware mod translation and
 * modifier matching.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/is-mac.util", () => ({ isMac: vi.fn(() => true) }));

import { matchCombo } from "../../src/utils/match-combo.util";
import { isMac } from "../../src/utils/is-mac.util";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";

const mockedIsMac = vi.mocked(isMac);

/**
 * Create a mock KeyboardEvent with the given properties.
 */
function createKeyEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: "a",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  } as unknown as KeyboardEvent;
}

describe("matchCombo", () => {
  beforeEach(() => {
    mockedIsMac.mockReturnValue(true);
  });

  describe("basic key matching", () => {
    it("matches when key matches", () => {
      const combo: KeyCombo = { key: "k" };
      const event = createKeyEvent({ key: "k" });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("does not match when key differs", () => {
      const combo: KeyCombo = { key: "k" };
      const event = createKeyEvent({ key: "j" });
      expect(matchCombo(combo, event)).toBe(false);
    });

    it("matches special keys", () => {
      const combo: KeyCombo = { key: "escape" };
      const event = createKeyEvent({ key: "Escape" });
      expect(matchCombo(combo, event)).toBe(true);
    });
  });

  describe("case-insensitive key comparison", () => {
    it("matches uppercase event key against lowercase combo key", () => {
      const combo: KeyCombo = { key: "k" };
      const event = createKeyEvent({ key: "K" });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("matches lowercase event key against uppercase combo key", () => {
      const combo: KeyCombo = { key: "K" };
      const event = createKeyEvent({ key: "k" });
      expect(matchCombo(combo, event)).toBe(true);
    });
  });

  describe("modifier matching — mod (platform-aware)", () => {
    it("on Mac: mod matches metaKey", () => {
      mockedIsMac.mockReturnValue(true);
      const combo: KeyCombo = { mod: true, key: "k" };
      const event = createKeyEvent({ key: "k", metaKey: true });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("on Mac: mod does not match ctrlKey alone", () => {
      mockedIsMac.mockReturnValue(true);
      const combo: KeyCombo = { mod: true, key: "k" };
      const event = createKeyEvent({ key: "k", ctrlKey: true });
      expect(matchCombo(combo, event)).toBe(false);
    });

    it("on non-Mac: mod matches ctrlKey", () => {
      mockedIsMac.mockReturnValue(false);
      const combo: KeyCombo = { mod: true, key: "k" };
      const event = createKeyEvent({ key: "k", ctrlKey: true });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("on non-Mac: mod does not match metaKey alone", () => {
      mockedIsMac.mockReturnValue(false);
      const combo: KeyCombo = { mod: true, key: "k" };
      const event = createKeyEvent({ key: "k", metaKey: true });
      expect(matchCombo(combo, event)).toBe(false);
    });

    it("fails when mod is required but not pressed", () => {
      const combo: KeyCombo = { mod: true, key: "k" };
      const event = createKeyEvent({ key: "k" });
      expect(matchCombo(combo, event)).toBe(false);
    });
  });

  describe("modifier matching — ctrl", () => {
    it("matches when ctrl is required and pressed", () => {
      const combo: KeyCombo = { ctrl: true, key: "c" };
      const event = createKeyEvent({ key: "c", ctrlKey: true });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("fails when ctrl is required but not pressed", () => {
      const combo: KeyCombo = { ctrl: true, key: "c" };
      const event = createKeyEvent({ key: "c", ctrlKey: false });
      expect(matchCombo(combo, event)).toBe(false);
    });
  });

  describe("modifier matching — alt", () => {
    it("matches when alt is required and pressed", () => {
      const combo: KeyCombo = { alt: true, key: "n" };
      const event = createKeyEvent({ key: "n", altKey: true });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("fails when alt is required but not pressed", () => {
      const combo: KeyCombo = { alt: true, key: "n" };
      const event = createKeyEvent({ key: "n", altKey: false });
      expect(matchCombo(combo, event)).toBe(false);
    });
  });

  describe("modifier matching — shift", () => {
    it("matches when shift is required and pressed", () => {
      const combo: KeyCombo = { shift: true, key: "p" };
      const event = createKeyEvent({ key: "p", shiftKey: true });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("fails when shift is required but not pressed", () => {
      const combo: KeyCombo = { shift: true, key: "p" };
      const event = createKeyEvent({ key: "p", shiftKey: false });
      expect(matchCombo(combo, event)).toBe(false);
    });
  });

  describe("modifier matching — meta", () => {
    it("matches when meta is required and pressed", () => {
      const combo: KeyCombo = { meta: true, key: "v" };
      const event = createKeyEvent({ key: "v", metaKey: true });
      expect(matchCombo(combo, event)).toBe(true);
    });

    it("fails when meta is required but not pressed", () => {
      const combo: KeyCombo = { meta: true, key: "v" };
      const event = createKeyEvent({ key: "v", metaKey: false });
      expect(matchCombo(combo, event)).toBe(false);
    });
  });

  describe("sequence combos return false", () => {
    it("returns false for sequence combos", () => {
      const combo: KeyCombo = { sequence: ["g", "p"] };
      const event = createKeyEvent({ key: "g" });
      expect(matchCombo(combo, event)).toBe(false);
    });

    it("returns false for non-empty sequence even with matching key", () => {
      const combo: KeyCombo = { sequence: ["k"], key: "k" };
      const event = createKeyEvent({ key: "k" });
      expect(matchCombo(combo, event)).toBe(false);
    });
  });

  describe("combos without a key return false", () => {
    it("returns false when combo has no key", () => {
      const combo: KeyCombo = { mod: true };
      const event = createKeyEvent({ key: "k", metaKey: true });
      expect(matchCombo(combo, event)).toBe(false);
    });

    it("returns false for empty combo", () => {
      const combo: KeyCombo = {};
      const event = createKeyEvent({ key: "a" });
      expect(matchCombo(combo, event)).toBe(false);
    });
  });
});
