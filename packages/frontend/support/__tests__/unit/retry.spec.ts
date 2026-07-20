/**
 * @file retry.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for `retry(fn, options)` — covers the
 *   scalar-`delay` + `backoff` progressions, the array-`delay`
 *   per-attempt override, the `when` predicate short-circuit, and
 *   the `onRetry` lifecycle hook (including the fail-soft semantics
 *   documented in `retry.util.ts`).
 *
 *   Uses `vi.useFakeTimers({ toFake: ['setTimeout'] })` so the
 *   internal `sleep(ms)` resolves synchronously via
 *   `vi.advanceTimersByTimeAsync(...)`, keeping every attempt
 *   deterministic without the test process idling on real timers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { retry } from "@/utils/retry.util";

// ────────────────────────────────────────────────────────────────────────
// Timer-driven helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Drive a pending retry through its scheduled delay. Awaiting the
 * returned promise flushes the microtasks queued by `sleep(ms)`'s
 * `setTimeout` handler AND the microtasks queued by the awaited
 * next attempt.
 */
async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

describe("retry (utility)", () => {
  beforeEach(() => {
    // `queueMicrotask` stays real so awaited promises still resolve
    // between fake-timer advances.
    vi.useFakeTimers({ toFake: ["setTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("first-attempt success", () => {
    it("returns the value on first success without scheduling a retry", async () => {
      const fn = vi.fn().mockResolvedValue("ok");
      const onRetry = vi.fn();

      const result = await retry(fn, { times: 3, delay: 100, onRetry });

      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(1);
      // No retry ever fired — the hook must NEVER have run.
      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe("exhausted retries", () => {
    it("retries up to `times` attempts, then re-throws the last error", async () => {
      let call = 0;
      const fn = vi.fn().mockImplementation(async () => {
        call += 1;
        throw new Error(`fail-${call}`);
      });

      const promise = retry(fn, { times: 3, delay: 10 });
      // Capture rejection early so the assertion doesn't race the
      // pending sleeps.
      const settled = expect(promise).rejects.toThrow("fail-3");

      // Two sleeps between three attempts — `attempt * base` under
      // linear backoff (10 + 20).
      await advance(10);
      await advance(20);

      await settled;
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("re-throws even when `fn` throws a non-Error value (coerces to Error)", async () => {
      const fn = vi.fn().mockRejectedValue("boom");
      const promise = retry(fn, { times: 2, delay: 5 });
      const settled = expect(promise).rejects.toThrow("boom");

      await advance(5);

      await settled;
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("honours the default of 3 attempts when `times` is omitted", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("nope"));
      const promise = retry(fn); // no options at all — defaults apply.
      const settled = expect(promise).rejects.toThrow("nope");

      // Default `delay = 100`, default `backoff = 'linear'`. Two
      // sleeps: 100ms then 200ms.
      await advance(100);
      await advance(200);

      await settled;
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe("backoff strategies", () => {
    it("applies constant-looking delay with linear backoff (base * attempt)", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("x"));
      const observed: number[] = [];
      const onRetry = vi.fn((_attempt: number, delayMs: number) => {
        observed.push(delayMs);
      });

      const promise = retry(fn, { times: 4, delay: 100, backoff: "linear", onRetry });
      const settled = expect(promise).rejects.toThrow("x");

      // Linear progression: 100 (before attempt 2), 200 (before
      // attempt 3), 300 (before attempt 4).
      await advance(100);
      await advance(200);
      await advance(300);

      await settled;
      expect(observed).toEqual([100, 200, 300]);
    });

    it("applies exponential backoff (base * 2^(attempt - 1))", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("x"));
      const observed: number[] = [];
      const onRetry = vi.fn((_attempt: number, delayMs: number) => {
        observed.push(delayMs);
      });

      const promise = retry(fn, { times: 4, delay: 100, backoff: "exponential", onRetry });
      const settled = expect(promise).rejects.toThrow("x");

      // Exponential progression: 100 * 2^0, 2^1, 2^2 = 100, 200, 400.
      await advance(100);
      await advance(200);
      await advance(400);

      await settled;
      expect(observed).toEqual([100, 200, 400]);
    });
  });

  describe("array delay (per-attempt overrides)", () => {
    it("delivers each entry in order for the corresponding retry wait", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("x"));
      const observed: number[] = [];
      const onRetry = vi.fn((_attempt: number, delayMs: number) => {
        observed.push(delayMs);
      });

      const promise = retry(fn, {
        times: 4,
        delay: [10, 20, 40],
        onRetry,
      });
      const settled = expect(promise).rejects.toThrow("x");

      // Three waits between four attempts — index 0, 1, 2.
      await advance(10);
      await advance(20);
      await advance(40);

      await settled;
      expect(observed).toEqual([10, 20, 40]);
    });

    it("reuses the last array entry when more attempts than entries", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("x"));
      const observed: number[] = [];
      const onRetry = vi.fn((_attempt: number, delayMs: number) => {
        observed.push(delayMs);
      });

      const promise = retry(fn, {
        times: 5,
        delay: [10, 20], // shorter than the wait count (4).
        onRetry,
      });
      const settled = expect(promise).rejects.toThrow("x");

      // Waits: 10, 20, 20 (last), 20 (last).
      await advance(10);
      await advance(20);
      await advance(20);
      await advance(20);

      await settled;
      expect(observed).toEqual([10, 20, 20, 20]);
    });

    it("ignores `backoff` when `delay` is an array", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("x"));
      const observed: number[] = [];

      const promise = retry(fn, {
        times: 3,
        delay: [50, 75],
        backoff: "exponential", // must be ignored per the interface docblock.
        onRetry: (_attempt, delayMs) => observed.push(delayMs),
      });
      const settled = expect(promise).rejects.toThrow("x");

      await advance(50);
      await advance(75);

      await settled;
      expect(observed).toEqual([50, 75]);
    });
  });

  describe("`when` predicate", () => {
    it("retries only when the predicate returns true", async () => {
      const fn = vi
        .fn()
        // First attempt — retryable.
        .mockRejectedValueOnce(new Error("retryable"))
        // Second attempt — success.
        .mockResolvedValueOnce("recovered");

      const when = vi.fn((err: Error) => err.message === "retryable");

      const promise = retry(fn, { times: 3, delay: 10, when });
      // Advance past the first wait so the second attempt runs.
      await advance(10);

      await expect(promise).resolves.toBe("recovered");
      expect(fn).toHaveBeenCalledTimes(2);
      expect(when).toHaveBeenCalledWith(new Error("retryable"));
    });

    it("short-circuits immediately when the predicate returns false", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("fatal"));
      const when = vi.fn(() => false);

      // No retry means no scheduled sleep — the promise rejects on
      // the same microtask tick.
      await expect(retry(fn, { times: 3, delay: 10, when })).rejects.toThrow("fatal");
      // Only one attempt was made.
      expect(fn).toHaveBeenCalledTimes(1);
      // The predicate saw the actual error.
      expect(when).toHaveBeenCalledWith(new Error("fatal"));
    });

    it("receives an Error even when `fn` throws a non-Error", async () => {
      const fn = vi.fn().mockRejectedValue("boom");
      let observedType: string | undefined;
      const when = vi.fn((err: Error) => {
        observedType = err instanceof Error ? "error" : typeof err;
        return false;
      });

      await expect(retry(fn, { times: 3, delay: 10, when })).rejects.toThrow("boom");
      expect(observedType).toBe("error");
    });
  });

  describe("`onRetry` hook", () => {
    it("fires with (upcomingAttempt, delayMs, previousError) before each retry", async () => {
      const failures = [new Error("fail-1"), new Error("fail-2")];
      const fn = vi
        .fn()
        .mockRejectedValueOnce(failures[0])
        .mockRejectedValueOnce(failures[1])
        .mockResolvedValueOnce("ok");

      const calls: Array<[number, number, string]> = [];
      const onRetry = vi.fn((attempt: number, delayMs: number, err: Error) => {
        calls.push([attempt, delayMs, err.message]);
      });

      const promise = retry(fn, { times: 3, delay: 100, backoff: "linear", onRetry });

      // Two retries — advance two linear waits (100, 200).
      await advance(100);
      await advance(200);

      await expect(promise).resolves.toBe("ok");
      // `attempt` counts the UPCOMING attempt number — starts at 2.
      expect(calls).toEqual([
        [2, 100, "fail-1"],
        [3, 200, "fail-2"],
      ]);
    });

    it("is not called when the first attempt succeeds", async () => {
      const fn = vi.fn().mockResolvedValue("ok");
      const onRetry = vi.fn();

      await expect(retry(fn, { times: 5, delay: 10, onRetry })).resolves.toBe("ok");
      expect(onRetry).not.toHaveBeenCalled();
    });

    it("is not called on the FINAL failing attempt (retries always precede a next attempt)", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("x"));
      const onRetry = vi.fn();

      const promise = retry(fn, { times: 3, delay: 10, onRetry });
      const settled = expect(promise).rejects.toThrow("x");

      await advance(10);
      await advance(20);

      await settled;
      // Fires ONLY between attempts 1→2 and 2→3 (not after the 3rd
      // failed attempt).
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("is fail-soft — an onRetry throw does not break the retry loop", async () => {
      const fn = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce("ok");

      const onRetry = vi.fn(() => {
        throw new Error("telemetry boom");
      });

      const promise = retry(fn, { times: 3, delay: 10, onRetry });
      // Even though the hook threw, the loop MUST still schedule
      // the next attempt.
      await advance(10);

      await expect(promise).resolves.toBe("ok");
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
