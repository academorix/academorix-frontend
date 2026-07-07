/**
 * @file create-query-client.test.ts
 * @module @academorix/query/client/__tests__/create-query-client.test
 *
 * @description
 * Unit tests for {@link createQueryClient}. Covers:
 *
 *  - The built-in defaults are present (`staleTime`, `gcTime`,
 *    `refetchOnWindowFocus`).
 *  - The retry policy — 5xx retries twice, 4xx never, transport
 *    failure (statusCode undefined) retries twice, non-HttpError
 *    values never retry.
 *  - Consumer-supplied `defaults` merge over the built-ins without
 *    losing the built-in fields.
 *  - Mutation defaults ship with `retry: false` and can be overridden.
 */

import { HttpError } from "@academorix/core/errors";
import { describe, expect, it } from "vitest";

import { createQueryClient } from "../create-query-client";

import type { DefaultOptions } from "@tanstack/react-query";

/**
 * Reads the retry option off the client's queries defaults, coerced
 * to the `(failureCount, error) => boolean | number` signature the
 * built-in policy uses. Kept as a helper so the tests read cleanly.
 */
function getRetryFn(defaults: DefaultOptions): (failureCount: number, error: unknown) => boolean {
  const retry = defaults.queries?.retry;

  if (typeof retry !== "function") {
    throw new Error("Expected the queries.retry default to be a function.");
  }

  return retry as (failureCount: number, error: unknown) => boolean;
}

describe("createQueryClient", () => {
  describe("query defaults", () => {
    it("ships with staleTime = 30 seconds", () => {
      const client = createQueryClient();
      const defaults = client.getDefaultOptions();

      expect(defaults.queries?.staleTime).toBe(30_000);
    });

    it("ships with gcTime = 5 minutes", () => {
      const client = createQueryClient();
      const defaults = client.getDefaultOptions();

      expect(defaults.queries?.gcTime).toBe(5 * 60_000);
    });

    it("ships with refetchOnWindowFocus disabled", () => {
      const client = createQueryClient();
      const defaults = client.getDefaultOptions();

      expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    });

    it("ships a retry function (not a number) so the policy can inspect the error", () => {
      const client = createQueryClient();
      const defaults = client.getDefaultOptions();

      expect(typeof defaults.queries?.retry).toBe("function");
    });
  });

  describe("retry policy", () => {
    it("retries 5xx errors up to twice", () => {
      const client = createQueryClient();
      const retry = getRetryFn(client.getDefaultOptions());
      const err = new HttpError("Server exploded", 500);

      expect(retry(0, err)).toBe(true);
      expect(retry(1, err)).toBe(true);
      // Third attempt: caps out.
      expect(retry(2, err)).toBe(false);
    });

    it("never retries 4xx errors (client bugs / auth failures don't get better)", () => {
      const client = createQueryClient();
      const retry = getRetryFn(client.getDefaultOptions());

      expect(retry(0, new HttpError("Not found", 404))).toBe(false);
      expect(retry(0, new HttpError("Unauthorized", 401))).toBe(false);
      expect(retry(0, new HttpError("Unprocessable", 422))).toBe(false);
    });

    it("retries transport failures (statusCode undefined) up to twice", () => {
      const client = createQueryClient();
      const retry = getRetryFn(client.getDefaultOptions());
      const err = new HttpError("Network is unreachable", undefined);

      expect(retry(0, err)).toBe(true);
      expect(retry(1, err)).toBe(true);
      expect(retry(2, err)).toBe(false);
    });

    it("never retries when the thrown value isn't an HttpError (code bug)", () => {
      const client = createQueryClient();
      const retry = getRetryFn(client.getDefaultOptions());

      expect(retry(0, new Error("plain error"))).toBe(false);
      expect(retry(0, "boom")).toBe(false);
      expect(retry(0, null)).toBe(false);
      expect(retry(0, undefined)).toBe(false);
    });
  });

  describe("consumer overrides", () => {
    it("merges consumer-supplied query defaults over the built-ins", () => {
      const client = createQueryClient({
        defaults: {
          queries: {
            staleTime: 60_000,
            refetchOnMount: "always",
          },
        },
      });
      const defaults = client.getDefaultOptions();

      // Overridden…
      expect(defaults.queries?.staleTime).toBe(60_000);
      expect(defaults.queries?.refetchOnMount).toBe("always");

      // …but the un-overridden built-ins are still there.
      expect(defaults.queries?.gcTime).toBe(5 * 60_000);
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
      expect(typeof defaults.queries?.retry).toBe("function");
    });

    it("lets consumers replace the retry policy wholesale", () => {
      const client = createQueryClient({
        defaults: {
          queries: {
            retry: 5,
          },
        },
      });
      const defaults = client.getDefaultOptions();

      expect(defaults.queries?.retry).toBe(5);
    });

    it("preserves mutation retry = false by default and lets consumers override it", () => {
      const client = createQueryClient();

      expect(client.getDefaultOptions().mutations?.retry).toBe(false);

      const overridden = createQueryClient({
        defaults: {
          mutations: { retry: 2 },
        },
      });

      expect(overridden.getDefaultOptions().mutations?.retry).toBe(2);
    });
  });
});
