/**
 * @file mock-nonce-generator.ts
 * @module @stackra/csp/testing
 * @description Deterministic nonce generator for tests.
 *
 *   Yields `'test-nonce-1'`, `'test-nonce-2'`, … on successive calls to
 *   `generate()`. Alternate sequences can be supplied via constructor
 *   options. Mirrors the shape of the runtime `NonceGenerator` so it can
 *   be swapped in wherever `NonceGenerator` is used.
 */

/** Options for {@link MockNonceGenerator}. */
export interface MockNonceGeneratorOptions {
  /** Custom nonce sequence — after exhaustion, falls back to `test-nonce-<n>`. */
  sequence?: readonly string[];
  /** Prefix used by the fallback generator. Default: `'test-nonce'`. */
  prefix?: string;
}

/**
 * Deterministic nonce generator for tests.
 *
 * @example
 * ```ts
 * const gen = new MockNonceGenerator();
 * expect(gen.generate()).toBe('test-nonce-1');
 * expect(gen.generate()).toBe('test-nonce-2');
 * ```
 */
export class MockNonceGenerator {
  /** Number of nonces generated so far. */
  public get callCount(): number {
    return this.counter;
  }

  private counter = 0;
  private readonly sequence: readonly string[];
  private readonly prefix: string;

  public constructor(options: MockNonceGeneratorOptions = {}) {
    this.sequence = options.sequence ?? [];
    this.prefix = options.prefix ?? "test-nonce";
  }

  /** Produce the next nonce in the configured sequence. */
  public generate(): string {
    if (this.counter < this.sequence.length) {
      const value = this.sequence[this.counter]!;
      this.counter += 1;
      return value;
    }
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }

  /** Reset the internal counter so `generate()` starts from the top. */
  public reset(): void {
    this.counter = 0;
  }
}
