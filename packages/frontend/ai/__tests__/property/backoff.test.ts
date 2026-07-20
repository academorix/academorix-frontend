/**
 * @file backoff.test.ts
 * @description Property 11 (Requirement 24.3) — reconnect delays are:
 *
 *   1. **Non-decreasing.** `delay[i+1] >= delay[i]` for every consecutive pair.
 *   2. **Capped.** `delay[i] <= capMs` for every attempt.
 *   3. **Bounded.** The sequence terminates in at most `maxAttempts` steps.
 *
 *   Validated over 250 randomised policies covering base/cap/max
 *   combinations. Uses the deterministic seeded PRNG so failures reproduce.
 */

import { describe, it } from "vitest";

import { ConnectionManager } from "@/core/services/connection-manager.service";
import type { IAiConfig, IAiRetryPolicy } from "@stackra/contracts";
import { forAll, type IPrng } from "./property-test.helper";

/** Generate a random valid retry policy. */
function genPolicy(r: IPrng): IAiRetryPolicy {
  const baseMs = r.int(1, 500);
  const capMs = baseMs + r.int(0, 30_000);
  const maxAttempts = r.int(1, 20);
  return { baseMs, capMs, maxAttempts };
}

/** Build a manager just to drain its scheduleReconnect() sequence. */
function drain(policy: IAiRetryPolicy): number[] {
  const config: IAiConfig = {
    baseUrl: "https://x",
    authProvider: {
      getCredentials: () => Promise.resolve({}),
      refresh: () => Promise.resolve({}),
    },
    retryPolicy: policy,
  };
  const manager = new ConnectionManager(config);
  manager.onModuleInit();

  const delays: number[] = [];
  let step = manager.scheduleReconnect();
  while (step !== null) {
    delays.push(step.delayMs);
    step = manager.scheduleReconnect();
  }
  return delays;
}

describe("Property 11: bounded exponential backoff (Req 24.3)", () => {
  it("is non-decreasing, capped at capMs, and stops after maxAttempts", () => {
    forAll(
      (r) => genPolicy(r),
      (policy) => {
        const delays = drain(policy);

        // 3. Bounded by maxAttempts.
        if (delays.length !== policy.maxAttempts) return false;

        for (let i = 0; i < delays.length; i++) {
          // 2. Every delay is capped.
          if (delays[i]! > policy.capMs) return false;
          // 2b. Every delay is non-negative.
          if (delays[i]! < 0) return false;
          // 1. Non-decreasing across the sequence.
          if (i > 0 && delays[i]! < delays[i - 1]!) return false;
        }
        return true;
      },
      { runs: 250 },
    );
  });
});
