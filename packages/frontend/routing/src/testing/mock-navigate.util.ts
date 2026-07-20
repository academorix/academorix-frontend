/**
 * @file mock-navigate.util.ts
 * @module @stackra/routing/testing
 * @description Mock navigate helper — records every dispatched call
 *   for later assertion.
 *
 *   Test surface:
 *     - `fn(to, opts?)` — the navigate function under test.
 *     - `calls` — every recorded call in dispatch order.
 *     - `reset()` — clear the recorded list.
 *
 *   Tests inject `fn` where a real `useNavigate()` result would be
 *   used, then assert on `calls`.
 */

import type { INavigateOptions } from "@stackra/contracts";

/**
 * A single recorded call.
 */
export interface INavigateCall {
  /** Destination — path or delta. */
  readonly to: string | number;

  /** Options passed on this dispatch. */
  readonly opts?: INavigateOptions;
}

/**
 * The mock navigator's return shape.
 */
export interface IMockNavigate {
  /** The navigate function itself. */
  readonly fn: (to: string | number, opts?: INavigateOptions) => Promise<void>;

  /** Every recorded call, oldest first. */
  readonly calls: readonly INavigateCall[];

  /** Reset the recorded call list. */
  readonly reset: () => void;
}

/**
 * Build a mock navigate helper.
 *
 * @returns Mock navigate.
 *
 * @example
 * ```typescript
 * const nav = mockNavigate();
 * await nav.fn('/dashboard');
 * expect(nav.calls).toEqual([{to: '/dashboard'}]);
 * ```
 */
export function mockNavigate(): IMockNavigate {
  // We track calls in a mutable array — the returned `calls` is a
  // live reference so tests can inspect it after every dispatch.
  const calls: INavigateCall[] = [];
  return {
    fn: async (to, opts) => {
      calls.push(opts ? { to, opts } : { to });
    },
    get calls() {
      return calls;
    },
    reset: () => {
      calls.length = 0;
    },
  };
}
