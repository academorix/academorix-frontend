/**
 * @file config-tokens.spec.ts
 * @module @stackra/contracts/__tests__/unit
 * @description Verifies every config token exported by `@stackra/contracts`
 *   is a unique `symbol` and does not collide with any other exported
 *   token in the package.
 */

import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_LOADER,
  CONFIGURATION_SERVICE_TOKEN,
  CONFIGURATION_TOKEN,
  VALIDATED_ENV_LOADER,
} from "@stackra/contracts";
import * as contracts from "@stackra/contracts";

describe("config tokens", () => {
  // Group each named export so failures are readable in the reporter.
  const CONFIG_TOKENS = {
    CONFIGURATION_TOKEN,
    CONFIGURATION_SERVICE_TOKEN,
    CONFIGURATION_LOADER,
    VALIDATED_ENV_LOADER,
  } as const;

  describe("shape", () => {
    it.each(Object.entries(CONFIG_TOKENS))("`%s` is a symbol", (_name: string, token) => {
      expect(typeof token).toBe("symbol");
    });

    it.each(Object.entries(CONFIG_TOKENS))(
      "`%s` uses Symbol(...) (local), not Symbol.for(...) (global registry)",
      (_name: string, token) => {
        // Local `Symbol(...)` is never round-tripped through the global
        // registry — verifies these tokens don't accidentally leak into
        // `Symbol.for` space where a third party could clash.
        expect(Symbol.keyFor(token as symbol)).toBeUndefined();
      },
    );
  });

  describe("uniqueness among themselves", () => {
    it("every config token is identity-distinct from every other", () => {
      const values = Object.values(CONFIG_TOKENS);
      // A Set of symbols deduplicates by identity. Length preservation
      // proves no two tokens are the same symbol.
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe("uniqueness across the contracts public API", () => {
    it("does not collide with any other token exported by contracts", () => {
      // Collect every runtime symbol exported by the barrel.
      const allSymbols: symbol[] = [];
      for (const key of Object.keys(contracts)) {
        const value = (contracts as Record<string, unknown>)[key];
        if (typeof value === "symbol") {
          allSymbols.push(value);
        }
      }

      // Sanity: our four tokens are in the set.
      for (const token of Object.values(CONFIG_TOKENS)) {
        expect(allSymbols).toContain(token);
      }

      // Every symbol in the set is identity-unique. If contracts ever
      // ships two exports pointing at the same symbol, this catches it.
      expect(new Set(allSymbols).size).toBe(allSymbols.length);
    });
  });
});
