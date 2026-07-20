/**
 * @file retry-interceptor.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `RetryInterceptor` — the
 *   `intercept(context, next)` path that composes `retry()` from
 *   `@stackra/support` and emits `HTTP_EVENTS.REQUEST_RETRY` through
 *   the injected event emitter.
 *
 *   Covers: successful first attempts (no retry), retryable 5xx
 *   responses, non-retryable 4xx responses, network errors
 *   (`statusCode === 0`), custom per-request overrides
 *   (`meta.maxRetries`, `meta.retryBackoff`), and the fail-soft
 *   emitter contract.
 *
 *   Uses `vi.useFakeTimers({ toFake: ['setTimeout'] })` to drive the
 *   internal retry sleeps deterministically. The emitter is a
 *   hand-rolled `IEventEmitter` shim (records emissions) — `http`
 *   doesn't depend on `@stackra/events` even in devDeps.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HTTP_EVENTS, HttpMethod } from "@stackra/contracts";
import type {
  IEventEmitter,
  IHttpContext,
  IHttpNextFunction,
  IHttpResponse,
} from "@stackra/contracts";

import { DEFAULT_MAX_RETRIES, DEFAULT_RETRY_BACKOFF } from "@/core/constants";
import { RetryInterceptor } from "@/core/interceptors/retry.interceptor";

// ────────────────────────────────────────────────────────────────────────
// Test scaffolding
// ────────────────────────────────────────────────────────────────────────

/** Recorded emission — matches the fields `RetryInterceptor.emit` uses. */
interface RecordedEmit {
  event: string;
  payload: unknown;
}

/**
 * Minimal `IEventEmitter` shim — records every `emit()` call and
 * gives tests a place to hook a throwing implementation for the
 * fail-soft check.
 *
 *   `emit()` is intentionally SYNCHRONOUS (returns a settled
 *   promise) so `shouldThrow` triggers the same code path
 *   `RetryInterceptor.emit`'s try/catch is designed for — a
 *   synchronously-thrown observer error. Returning a rejected
 *   promise instead would surface as an unhandled rejection
 *   because the interceptor deliberately doesn't `.catch()` its
 *   emit — fire-and-forget by design.
 */
class RecordingEventEmitter implements IEventEmitter {
  public readonly emitted: RecordedEmit[] = [];
  public shouldThrow = false;

  public emit(event: string, payload?: unknown): Promise<void> {
    if (this.shouldThrow) {
      throw new Error("emit boom");
    }
    this.emitted.push({ event, payload });
    return Promise.resolve();
  }

  public on(): () => void {
    return () => undefined;
  }

  public eventNames(): Array<string | symbol> {
    return [];
  }

  public listenerCount(): number {
    return 0;
  }

  public removeAllListeners(): void {
    /* no-op */
  }
}

/** Build a fresh `IHttpContext` for each test. */
function makeContext(overrides: Partial<IHttpContext["request"]> = {}): IHttpContext {
  return {
    request: {
      method: HttpMethod.GET,
      url: "/users",
      baseURL: "https://api.example.com",
      meta: {},
      ...overrides,
    },
    metadata: new Map(),
  };
}

/** Convenience — synthesise an HTTP-shaped error the interceptor recognises. */
function httpError(statusCode: number, message = `HTTP ${statusCode}`): Error {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

/**
 * Advance the fake `setTimeout` queue and flush microtasks so the
 * scheduled retry attempt actually runs.
 */
async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

/**
 * Read the total sum of default backoff waits between attempts.
 * `DEFAULT_MAX_RETRIES = 3`, `DEFAULT_RETRY_BACKOFF = [1000, 2000, 4000]`
 * → 4 attempts total → 3 waits: 1000, 2000, 4000.
 */
function totalDefaultWaits(): number {
  return DEFAULT_RETRY_BACKOFF.slice(0, DEFAULT_MAX_RETRIES).reduce((a, b) => a + b, 0);
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("RetryInterceptor", () => {
  let emitter: RecordingEventEmitter;
  let interceptor: RetryInterceptor;
  let response: IHttpResponse;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    emitter = new RecordingEventEmitter();
    interceptor = new RetryInterceptor(emitter);
    response = {
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("happy path", () => {
    it("returns the response on first success and emits no retry event", async () => {
      const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

      const result = await interceptor.intercept(makeContext(), next);

      expect(result).toBe(response);
      expect(next).toHaveBeenCalledTimes(1);
      // Zero emissions — no retry ever happened.
      expect(emitter.emitted).toHaveLength(0);
    });
  });

  describe("retryable failures", () => {
    it("retries on 5xx and eventually resolves once `next` succeeds", async () => {
      const next: IHttpNextFunction = vi
        .fn()
        // First attempt — 503.
        .mockRejectedValueOnce(httpError(503, "unavailable"))
        // Second attempt — success.
        .mockResolvedValueOnce(response);

      const promise = interceptor.intercept(makeContext(), next);

      // One wait between attempt 1 and 2 — default backoff[0] = 1000ms.
      await advance(DEFAULT_RETRY_BACKOFF[0]!);

      await expect(promise).resolves.toBe(response);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it("retries on network errors (statusCode === 0)", async () => {
      const next: IHttpNextFunction = vi
        .fn()
        .mockRejectedValueOnce(httpError(0, "network unreachable"))
        .mockResolvedValueOnce(response);

      const promise = interceptor.intercept(makeContext(), next);
      await advance(DEFAULT_RETRY_BACKOFF[0]!);

      await expect(promise).resolves.toBe(response);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it("exhausts the retry budget and re-throws the last error", async () => {
      const finalError = httpError(500, "boom-3");
      const next: IHttpNextFunction = vi
        .fn()
        .mockRejectedValueOnce(httpError(500, "boom-0"))
        .mockRejectedValueOnce(httpError(500, "boom-1"))
        .mockRejectedValueOnce(httpError(500, "boom-2"))
        .mockRejectedValueOnce(finalError);

      const promise = interceptor.intercept(makeContext(), next);
      const settled = expect(promise).rejects.toBe(finalError);

      // Total attempts = maxRetries + 1 = 4 → three waits.
      for (const ms of DEFAULT_RETRY_BACKOFF.slice(0, DEFAULT_MAX_RETRIES)) {
        await advance(ms);
      }

      await settled;
      expect(next).toHaveBeenCalledTimes(DEFAULT_MAX_RETRIES + 1);
    });
  });

  describe("non-retryable failures", () => {
    it("re-throws immediately on 4xx without emitting a retry", async () => {
      const err = httpError(404, "not found");
      const next: IHttpNextFunction = vi.fn().mockRejectedValue(err);

      await expect(interceptor.intercept(makeContext(), next)).rejects.toBe(err);
      expect(next).toHaveBeenCalledTimes(1);
      expect(emitter.emitted).toHaveLength(0);
    });

    it("re-throws immediately on non-object errors (unknown shape)", async () => {
      const next: IHttpNextFunction = vi.fn().mockRejectedValue("bare-string");

      await expect(interceptor.intercept(makeContext(), next)).rejects.toThrow("bare-string");
      expect(next).toHaveBeenCalledTimes(1);
      expect(emitter.emitted).toHaveLength(0);
    });

    it("re-throws immediately when statusCode is undefined", async () => {
      const err = new Error("no status");
      const next: IHttpNextFunction = vi.fn().mockRejectedValue(err);

      await expect(interceptor.intercept(makeContext(), next)).rejects.toBe(err);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("REQUEST_RETRY event emission", () => {
    it("emits with the right payload before each retry (attempt starts at 1)", async () => {
      const next: IHttpNextFunction = vi
        .fn()
        .mockRejectedValueOnce(httpError(503, "boom-0"))
        .mockRejectedValueOnce(httpError(503, "boom-1"))
        .mockResolvedValueOnce(response);

      const promise = interceptor.intercept(
        makeContext({ url: "/orders", method: HttpMethod.POST }),
        next,
      );

      // Two retries → two events → two backoff waits.
      await advance(DEFAULT_RETRY_BACKOFF[0]!);
      await advance(DEFAULT_RETRY_BACKOFF[1]!);

      await expect(promise).resolves.toBe(response);

      expect(emitter.emitted).toHaveLength(2);
      // First retry — attempt 1, delay = backoff[0], previous
      // error's message on `error`.
      expect(emitter.emitted[0]).toEqual({
        event: HTTP_EVENTS.REQUEST_RETRY,
        payload: {
          method: HttpMethod.POST,
          url: "/orders",
          attempt: 1,
          delayMs: DEFAULT_RETRY_BACKOFF[0],
          error: "boom-0",
        },
      });
      // Second retry — attempt 2, delay = backoff[1].
      expect(emitter.emitted[1]).toEqual({
        event: HTTP_EVENTS.REQUEST_RETRY,
        payload: {
          method: HttpMethod.POST,
          url: "/orders",
          attempt: 2,
          delayMs: DEFAULT_RETRY_BACKOFF[1],
          error: "boom-1",
        },
      });
    });

    it("is fail-soft — a throwing emitter never breaks the retry loop", async () => {
      emitter.shouldThrow = true;
      const next: IHttpNextFunction = vi
        .fn()
        .mockRejectedValueOnce(httpError(500, "boom"))
        .mockResolvedValueOnce(response);

      const promise = interceptor.intercept(makeContext(), next);
      await advance(DEFAULT_RETRY_BACKOFF[0]!);

      // Retry still succeeded despite the emit() throw.
      await expect(promise).resolves.toBe(response);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it("does not emit when no emitter was injected", async () => {
      // Simulates the `@Optional()` DI hole — no emitter provided.
      const noEmitter = new RetryInterceptor(undefined);
      const next: IHttpNextFunction = vi
        .fn()
        .mockRejectedValueOnce(httpError(500, "boom"))
        .mockResolvedValueOnce(response);

      const promise = noEmitter.intercept(makeContext(), next);
      await advance(DEFAULT_RETRY_BACKOFF[0]!);

      await expect(promise).resolves.toBe(response);
    });
  });

  describe("per-request overrides via `meta`", () => {
    it("honours `meta.maxRetries` — 0 disables retries entirely", async () => {
      const err = httpError(500, "boom");
      const next: IHttpNextFunction = vi.fn().mockRejectedValue(err);

      const promise = interceptor.intercept(makeContext({ meta: { maxRetries: 0 } }), next);

      // maxRetries=0 → times=1 → no waits → immediate reject.
      await expect(promise).rejects.toBe(err);
      expect(next).toHaveBeenCalledTimes(1);
      expect(emitter.emitted).toHaveLength(0);
    });

    it("honours `meta.maxRetries` — smaller than default retries less", async () => {
      const err = httpError(500, "boom");
      const next: IHttpNextFunction = vi.fn().mockRejectedValue(err);

      const promise = interceptor.intercept(
        makeContext({ meta: { maxRetries: 1 } }), // 1 retry → 2 total attempts.
        next,
      );
      const settled = expect(promise).rejects.toBe(err);

      await advance(DEFAULT_RETRY_BACKOFF[0]!);

      await settled;
      expect(next).toHaveBeenCalledTimes(2);
      // One retry event — for the single failing attempt→retry hop.
      expect(emitter.emitted).toHaveLength(1);
    });

    it("honours `meta.retryBackoff` — custom per-attempt delays", async () => {
      const err = httpError(500, "boom");
      const next: IHttpNextFunction = vi.fn().mockRejectedValue(err);

      const custom = [42, 84];
      const promise = interceptor.intercept(
        makeContext({ meta: { maxRetries: 2, retryBackoff: custom } }),
        next,
      );
      const settled = expect(promise).rejects.toBe(err);

      await advance(custom[0]!);
      await advance(custom[1]!);

      await settled;
      expect(emitter.emitted.map((e) => (e.payload as { delayMs: number }).delayMs)).toEqual(
        custom,
      );
    });
  });

  describe("total attempts arithmetic", () => {
    it("runs `maxRetries + 1` total attempts under the defaults", async () => {
      const err = httpError(500, "boom");
      const next: IHttpNextFunction = vi.fn().mockRejectedValue(err);

      const promise = interceptor.intercept(makeContext(), next);
      const settled = expect(promise).rejects.toBe(err);

      await advance(totalDefaultWaits());

      await settled;
      // 3 retries + 1 initial = 4 total.
      expect(next).toHaveBeenCalledTimes(DEFAULT_MAX_RETRIES + 1);
      // Three emitted retry events (one before each of the three retries).
      expect(emitter.emitted).toHaveLength(DEFAULT_MAX_RETRIES);
    });
  });
});
