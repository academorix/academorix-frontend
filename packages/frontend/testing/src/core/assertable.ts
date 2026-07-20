/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file assertable.ts
 * @module @stackra/testing/core
 * @description Assertable class — the base for objects whose method calls
 *   should be recorded so tests can assert on them after the fact.
 *
 *   Consumers typically don't extend `Assertable` directly. They wrap an
 *   arbitrary object in `createAssertableProxy()` (see
 *   `./assertable-proxy.ts`) which returns a Proxy that forwards every
 *   method call to the wrapped instance while recording it on an internal
 *   `Assertable` bookkeeper.
 */

import type { ICallRecord } from "./interfaces/call-record.interface";
import type { IStubEntry } from "./interfaces/stub-entry.interface";
import { CallAssertion } from "./call-assertion";

/**
 * Bookkeeper attached to every proxy returned by `createAssertableProxy`.
 *
 * Tracks call history and per-method stubs. Provides fluent assertion
 * helpers so consumers can drop-in-replace vitest's `vi.fn()`-style
 * matchers with rich, typed access to call records.
 */
export class Assertable {
  private readonly _calls: ICallRecord[] = [];
  private readonly _stubs = new Map<string, IStubEntry>();
  private _sequence = 0;

  // ── Recording ─────────────────────────────────────────────────────────

  /**
   * Record a method call. Called internally by the proxy handler.
   *
   * @internal
   */
  public record(record: Omit<ICallRecord, "sequence" | "timestamp">): void {
    this._calls.push({
      ...record,
      sequence: this._sequence++,
      timestamp: Date.now(),
    });
  }

  // ── Stubbing ──────────────────────────────────────────────────────────

  /**
   * Stub a method to return a fixed value.
   *
   * @param method - Method name to stub
   * @param returnValue - Value the stubbed method should return
   */
  public stub<T = unknown>(method: string, returnValue: T): this {
    this._stubs.set(method, { returnValue });
    return this;
  }

  /**
   * Stub a method with a custom implementation.
   *
   * @param method - Method name to stub
   * @param implementation - Function invoked with the original arguments
   */
  public stubImplementation<TArgs extends readonly unknown[] = unknown[], TReturn = unknown>(
    method: string,
    implementation: (...args: TArgs) => TReturn,
  ): this {
    this._stubs.set(method, { implementation: implementation as any });
    return this;
  }

  /**
   * Stub a method to throw the given value.
   *
   * @param method - Method name to stub
   * @param error - Error to throw when the method is called
   */
  public stubThrow(method: string, error: unknown): this {
    this._stubs.set(method, { throws: error });
    return this;
  }

  /**
   * Look up a stub for a method.
   *
   * @internal
   */
  public getStub(method: string): IStubEntry | undefined {
    return this._stubs.get(method);
  }

  /**
   * Remove all stubs.
   */
  public clearStubs(): this {
    this._stubs.clear();
    return this;
  }

  // ── Assertions ────────────────────────────────────────────────────────

  /** All recorded calls in chronological order. */
  public get calls(): readonly ICallRecord[] {
    return this._calls;
  }

  /** Recorded calls for a specific method. */
  public callsFor(method: string): ICallRecord[] {
    return this._calls.filter((c) => c.method === method);
  }

  /** Whether any call to the given method was recorded. */
  public wasCalled(method: string): boolean {
    return this._calls.some((c) => c.method === method);
  }

  /** Number of times the given method was called. */
  public callCount(method: string): number {
    return this.callsFor(method).length;
  }

  /** Total number of recorded calls across all methods. */
  public get totalCalls(): number {
    return this._calls.length;
  }

  /** Whether the method was called with the given args (deep-equal on JSON serialisation). */
  public wasCalledWith(method: string, ...args: unknown[]): boolean {
    const target = JSON.stringify(args);
    return this.callsFor(method).some((c) => JSON.stringify(c.args) === target);
  }

  // ── Fluent assertion DSL ─────────────────────────────────────────────

  /**
   * Open a fluent, self-throwing assertion for the given method.
   *
   * Chain `.with(...)` to narrow by arguments, then terminate with
   * `.once()` / `.twice()` / `.times(n)` / `.never()` / `.atLeast(n)` /
   * `.atMost(n)` — the terminal throws with a descriptive error when
   * the expectation isn't met.
   *
   * @example
   * ```ts
   * mock.$.assertCalled('getUser').with('42').once();
   * mock.$.assertCalled('save').times(3);
   * mock.$.assertCalled('close').never();
   * ```
   */
  public assertCalled(method: string): CallAssertion {
    return new CallAssertion(method, this._calls);
  }

  /**
   * Sugar for `assertCalled(method).never()` — throws when the method
   * was called at all (with any args).
   */
  public assertNotCalled(method: string): void {
    this.assertCalled(method).never();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  /** Clear call history and stubs. */
  public reset(): this {
    this._calls.length = 0;
    this._stubs.clear();
    this._sequence = 0;
    return this;
  }
}
