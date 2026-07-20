/**
 * @file focus-stack.test.ts
 * @description Property 6 (Requirements 11.2, 11.3) — for any random set
 *   of context frames, `orderedStack()` is:
 *
 *   1. **Sorted** by `(priority desc, seq desc)`.
 *   2. **A permutation** of the registered frames — same length, same
 *      set of keys, no duplicates, no drops.
 */

import { describe, it } from "vitest";

import { ContextRegistry } from "@/core/registries/context.registry";
import { forAll, type IPrng } from "./property-test.helper";

/** Generate an ops program that registers N random frames. */
function genFrames(r: IPrng): Array<{ key: string; priority: number }> {
  const n = r.int(0, 20);
  const frames: Array<{ key: string; priority: number }> = [];
  for (let i = 0; i < n; i++) {
    frames.push({ key: `k${i}`, priority: r.int(-3, 4) });
  }
  return frames;
}

describe("Property 6: focus-stack ordering (Req 11.2, 11.3)", () => {
  it("orderedStack is sorted by (priority desc, seq desc) AND a permutation of inputs", () => {
    forAll(
      (r) => genFrames(r),
      (frames) => {
        const registry = new ContextRegistry();
        for (const f of frames)
          registry.register({ key: f.key, snapshot: null, priority: f.priority });

        const stack = registry.orderedStack();

        // 1. Permutation.
        if (stack.length !== frames.length) return false;
        const inputKeys = new Set(frames.map((f) => f.key));
        const outputKeys = new Set(stack.map((f) => f.key));
        if (inputKeys.size !== outputKeys.size) return false;
        for (const key of inputKeys) if (!outputKeys.has(key)) return false;

        // 2. Sorted.
        for (let i = 1; i < stack.length; i++) {
          const prev = stack[i - 1]!;
          const curr = stack[i]!;
          if (prev.priority < curr.priority) return false;
          if (prev.priority === curr.priority && prev.seq < curr.seq) return false;
        }
        return true;
      },
      { runs: 250 },
    );
  });
});
