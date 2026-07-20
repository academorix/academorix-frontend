/**
 * @file property-test.helper.ts
 * @module @stackra/ai/__tests__/property
 * @description Lightweight property-test primitives — a seeded PRNG plus
 *   a `forAll` runner — sufficient for the P1–P11 correctness properties
 *   without pulling in `fast-check`.
 *
 *   Tests seed the PRNG deterministically so failures reproduce, and each
 *   property runs a configurable number of iterations (default 250).
 */

/** A pseudo-random number generator. */
export interface IPrng {
  /** Random floating-point in `[0, 1)`. */
  next(): number;
  /** Random integer in `[min, max)`. */
  int(min: number, max: number): number;
  /** Random element from an array (never called with an empty one). */
  pick<T>(arr: readonly T[]): T;
  /** Random boolean. */
  bool(): boolean;
}

/**
 * Mulberry-32 seeded PRNG — small, deterministic, statistically fine for
 * property testing at N ~= 250 iterations.
 */
export function makePrng(seed = 0xa1b2c3d4): IPrng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min: number, max: number): number {
      if (max <= min) return min;
      return min + Math.floor(next() * (max - min));
    },
    pick<T>(arr: readonly T[]): T {
      // Callers ensure the array is non-empty.
      return arr[Math.floor(next() * arr.length)] as T;
    },
    bool(): boolean {
      return next() < 0.5;
    },
  };
}

/** Options for {@link forAll}. */
export interface IForAllOptions {
  /** Number of iterations to run. Default: 250. */
  runs?: number;
  /** Seed for the deterministic PRNG. Default: `0xa1b2c3d4`. */
  seed?: number;
}

/**
 * Property-test runner.
 *
 * Repeatedly calls `check` with a fresh PRNG-derived arbitrary value.
 * When the property fails, the seed and iteration index are reported so
 * the failure reproduces.
 *
 * @param gen - Generator that produces one arbitrary input.
 * @param check - Predicate under test; return `false` (or throw) to fail.
 * @param options - Iteration/seed overrides.
 *
 * @example
 * ```typescript
 * forAll(
 *   (r) => r.int(0, 100),
 *   (n) => n >= 0 && n < 100,
 * );
 * ```
 */
export function forAll<T>(
  gen: (prng: IPrng) => T,
  check: (value: T) => boolean | void,
  options: IForAllOptions = {}
): void {
  const runs = options.runs ?? 250;
  const seed = options.seed ?? 0xa1b2c3d4;
  const prng = makePrng(seed);

  for (let i = 0; i < runs; i++) {
    const value = gen(prng);
    let ok = true;
    let thrown: unknown;
    try {
      ok = check(value) !== false;
    } catch (err) {
      ok = false;
      thrown = err;
    }
    if (!ok) {
      const dump = safeStringify(value);
      const hint = thrown instanceof Error ? ` — ${thrown.message}` : '';
      throw new Error(
        `Property failed at iteration ${i} (seed=0x${seed.toString(16)})${hint}\n  value=${dump}`
      );
    }
  }
}

/** Safe stringifier that never blows up on cyclic / big-int / function values. */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
