/**
 * @file call-assertion.ts
 * @module @stackra/testing/core
 * @description Fluent, self-throwing assertion DSL for `Assertable`.
 *
 *   The predicate API on `Assertable` (`wasCalled`, `wasCalledWith`,
 *   `callCount`) returns booleans/numbers — you pair them with your
 *   test framework's `expect(...)` matchers. The DSL exposed here is
 *   the *chainable* alternative: build up a filter with `.with(...)`
 *   and terminate with `.once()` / `.times(n)` / `.never()` / etc.
 *   Failures throw a rich `Error` with a diff of expected vs actual
 *   calls — no `expect()` wrapper needed.
 *
 *   ```ts
 *   mock.$.assertCalled('getUser').with('42').once();
 *   mock.$.assertCalled('save').times(3);
 *   mock.$.assertCalled('close').never();
 *   ```
 */

import type { ICallRecord } from "./interfaces/call-record.interface";

/**
 * Chainable, self-throwing assertion builder returned by
 * `Assertable.assertCalled(method)`.
 *
 * Every method that doesn't return `this` is a **terminal** — it
 * evaluates the current filter and throws when the expectation is
 * unmet. Every method that returns `this` narrows the filter further
 * before the terminal fires.
 */
export class CallAssertion {
  /**
   * Calls matching the current filter. Starts as every call for the
   * target method and is narrowed by each `.with(...)` invocation.
   */
  private filtered: readonly ICallRecord[];

  /**
   * Human-readable description of the filter so error messages can
   * echo back exactly what was expected. Grows with each `.with(...)`
   * call.
   */
  private description: string;

  /**
   * @param method - Method name the assertion targets.
   * @param allCalls - Full call history from the parent `Assertable`.
   */
  public constructor(
    private readonly method: string,
    private readonly allCalls: readonly ICallRecord[],
  ) {
    this.filtered = allCalls.filter((c) => c.method === method);
    this.description = `${method}(*)`;
  }

  // ── Narrowing ────────────────────────────────────────────────────────

  /**
   * Narrow the filter to calls invoked with exactly `args`.
   *
   * Uses JSON serialisation to compare — matching the semantics of
   * `Assertable.wasCalledWith`. Sufficient for value comparisons;
   * reference-equal deps (functions, class instances) will not match
   * unless they're literally the same reference in every recorded call.
   *
   * @param args - Full argument list to match. Provide every arg the
   *               call is expected to have received.
   */
  public with(...args: unknown[]): this {
    const target = JSON.stringify(args);
    this.filtered = this.filtered.filter((c) => JSON.stringify(c.args) === target);
    this.description = `${this.method}(${args.map((a) => this.format(a)).join(", ")})`;
    return this;
  }

  // ── Terminals ────────────────────────────────────────────────────────

  /** Assert the method was called exactly once with the current filter. */
  public once(): void {
    this.assertCount(1);
  }

  /** Assert the method was called exactly twice with the current filter. */
  public twice(): void {
    this.assertCount(2);
  }

  /** Assert the method was called exactly `count` times with the current filter. */
  public times(count: number): void {
    this.assertCount(count);
  }

  /** Assert the method was **never** called with the current filter. */
  public never(): void {
    this.assertCount(0);
  }

  /** Assert the method was called at least `count` times with the current filter. */
  public atLeast(count: number): void {
    if (this.filtered.length < count) {
      this.fail(`at least ${count} call(s)`);
    }
  }

  /** Assert the method was called at most `count` times with the current filter. */
  public atMost(count: number): void {
    if (this.filtered.length > count) {
      this.fail(`at most ${count} call(s)`);
    }
  }

  // ── Introspection (non-terminal, non-throwing) ───────────────────────

  /**
   * The calls that match the current filter — useful for chaining into
   * a framework matcher like `expect(mock.$.assertCalled('foo').calls)`.
   */
  public get calls(): readonly ICallRecord[] {
    return this.filtered;
  }

  /** The first matching call (if any). */
  public get first(): ICallRecord | undefined {
    return this.filtered[0];
  }

  /** The last matching call (if any). */
  public get last(): ICallRecord | undefined {
    return this.filtered[this.filtered.length - 1];
  }

  // ── Private ──────────────────────────────────────────────────────────

  /** Terminal helper — throws unless the filter has exactly `expected` calls. */
  private assertCount(expected: number): void {
    if (this.filtered.length !== expected) {
      this.fail(`exactly ${expected} call(s)`);
    }
  }

  /** Build and throw a descriptive assertion error. */
  private fail(expected: string): never {
    const observed = this.filtered.length;
    const allForMethod = this.allCalls.filter((c) => c.method === this.method).length;
    const hint =
      observed !== allForMethod
        ? ` (${allForMethod} total call(s) to ${this.method}, ${observed} matched the filter)`
        : "";
    const historyPreview = this.previewHistory();
    throw new Error(
      `Assertable: expected ${expected} to ${this.description}, ` +
        `but received ${observed}${hint}.${historyPreview}`,
    );
  }

  /** Compact representation of every call recorded for the target method. */
  private previewHistory(): string {
    const calls = this.allCalls.filter((c) => c.method === this.method);
    if (calls.length === 0) return "";
    const lines = calls.map(
      (c, i) => `\n  #${i}: ${this.method}(${c.args.map((a) => this.format(a)).join(", ")})`,
    );
    return `\nRecorded calls for ${this.method}:${lines.join("")}`;
  }

  /** Best-effort short form of a value for error messages. */
  private format(value: unknown): string {
    if (value === undefined) return "undefined";
    if (typeof value === "function") {
      const name = (value as { name?: string }).name;
      return name ? `[Function: ${name}]` : "[Function]";
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
