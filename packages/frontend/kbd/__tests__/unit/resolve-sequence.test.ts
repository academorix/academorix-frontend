/**
 * Unit Tests — resolveSequence
 *
 * Tests for the resolveSequence utility which picks the correct
 * sequence for the current platform from a KeyCombo.
 *
 * @module @stackra/kbd/tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/is-mac.util", () => ({ isMac: vi.fn(() => false) }));

import { resolveSequence } from "../../src/utils/resolve-sequence.util";
import { isMac } from "../../src/utils/is-mac.util";
import type { KeyCombo } from "../../src/interfaces/key-combo.interface";

const mockedIsMac = vi.mocked(isMac);

describe("resolveSequence", () => {
  beforeEach(() => {
    mockedIsMac.mockReturnValue(false);
  });

  describe("direct sequence resolution", () => {
    it("returns the sequence array lowercased", () => {
      const combo: KeyCombo = { sequence: ["G", "P"] };
      expect(resolveSequence(combo)).toEqual(["g", "p"]);
    });

    it("returns single-key sequences", () => {
      const combo: KeyCombo = { sequence: ["H"] };
      expect(resolveSequence(combo)).toEqual(["h"]);
    });

    it("preserves order of keys", () => {
      const combo: KeyCombo = { sequence: ["A", "B", "C"] };
      expect(resolveSequence(combo)).toEqual(["a", "b", "c"]);
    });

    it("takes priority over keys when both are set", () => {
      const combo: KeyCombo = {
        sequence: ["x", "y"],
        keys: { mac: ["a", "b"] },
      };
      expect(resolveSequence(combo)).toEqual(["x", "y"]);
    });
  });

  describe("platform-specific keys", () => {
    it("resolves mac keys when on mac", () => {
      mockedIsMac.mockReturnValue(true);
      const combo: KeyCombo = {
        keys: { mac: ["G", "M"], windows: ["G", "W"] },
      };
      expect(resolveSequence(combo)).toEqual(["g", "m"]);
    });

    it("resolves windows keys when on windows", () => {
      mockedIsMac.mockReturnValue(false);
      // Mock navigator for Windows detection
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Windows NT 10.0" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = {
        keys: { mac: ["G", "M"], windows: ["G", "W"] },
      };
      expect(resolveSequence(combo)).toEqual(["g", "w"]);

      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });
    });

    it("resolves linux keys when on linux", () => {
      mockedIsMac.mockReturnValue(false);
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Linux x86_64" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = {
        keys: { mac: ["G", "M"], linux: ["G", "L"] },
      };
      expect(resolveSequence(combo)).toEqual(["g", "l"]);

      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });
    });
  });

  describe("fallback to first available platform", () => {
    it("falls back to first non-empty entry when platform not matched", () => {
      mockedIsMac.mockReturnValue(false);
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = {
        keys: { mac: ["G", "F"] },
      };
      // No windows/linux match, should fall back to mac entry
      expect(resolveSequence(combo)).toEqual(["g", "f"]);
    });

    it("skips empty arrays in fallback", () => {
      mockedIsMac.mockReturnValue(false);
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "" },
        writable: true,
        configurable: true,
      });

      const combo: KeyCombo = {
        keys: { mac: [], windows: ["W", "X"] },
      };
      expect(resolveSequence(combo)).toEqual(["w", "x"]);
    });
  });

  describe("returns undefined when no sequence configured", () => {
    it("returns undefined for combo with only a key", () => {
      const combo: KeyCombo = { key: "k", mod: true };
      expect(resolveSequence(combo)).toBeUndefined();
    });

    it("returns undefined for empty combo", () => {
      const combo: KeyCombo = {};
      expect(resolveSequence(combo)).toBeUndefined();
    });

    it("returns undefined for empty sequence array", () => {
      const combo: KeyCombo = { sequence: [] };
      expect(resolveSequence(combo)).toBeUndefined();
    });

    it("returns undefined when keys object has no entries", () => {
      const combo: KeyCombo = { keys: {} };
      expect(resolveSequence(combo)).toBeUndefined();
    });

    it("returns undefined when all platform arrays are empty", () => {
      const combo: KeyCombo = { keys: { mac: [], windows: [], linux: [] } };
      expect(resolveSequence(combo)).toBeUndefined();
    });
  });

  describe("lowercase normalization", () => {
    it("lowercases all keys in direct sequence", () => {
      const combo: KeyCombo = { sequence: ["Escape", "ENTER", "Space"] };
      expect(resolveSequence(combo)).toEqual(["escape", "enter", "space"]);
    });

    it("lowercases all keys in platform-specific sequences", () => {
      mockedIsMac.mockReturnValue(true);
      const combo: KeyCombo = { keys: { mac: ["G", "P"] } };
      expect(resolveSequence(combo)).toEqual(["g", "p"]);
    });
  });
});
