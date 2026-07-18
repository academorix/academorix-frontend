/**
 * @file assert-action-dispatched.ts
 * @module @stackra/actions/testing
 * @description Chainable assertions over an {@link IMockDispatcher}.
 */

import { ActionAssertionError } from '../core/errors';
import type { IMockDispatcher } from './create-mock-dispatcher';

/**
 * Return shape of {@link assertActionDispatched}.
 */
export interface IActionDispatchedAssertion {
  /**
   * Assert the descriptor of every matching call matches the supplied
   * matcher (deep-equal by JSON) or predicate.
   */
  withPayload(matcher: unknown | ((descriptor: unknown) => boolean)): IActionDispatchedAssertion;

  /** Assert the action was dispatched exactly `n` times. */
  times(n: number): void;

  /** Assert the action was dispatched at least once. */
  atLeastOnce(): void;
}

/**
 * Assert that an action of `kind` was dispatched on the mock.
 *
 * @example
 * ```ts
 * assertActionDispatched(mock, 'toast').times(1);
 * assertActionDispatched(mock, 'toast').withPayload({ message: 'Hi' }).atLeastOnce();
 * ```
 */
export function assertActionDispatched(
  mock: IMockDispatcher,
  kind: string
): IActionDispatchedAssertion {
  let matching = mock.calls.filter((c) => c.descriptor.kind === kind);

  const api: IActionDispatchedAssertion = {
    withPayload(matcher) {
      if (typeof matcher === 'function') {
        matching = matching.filter((c) => (matcher as (d: unknown) => boolean)(c.descriptor));
      } else {
        const serialized = JSON.stringify(matcher);
        matching = matching.filter((c) => JSON.stringify(c.descriptor) === serialized);
      }
      return api;
    },
    times(n) {
      if (matching.length !== n) {
        throw new ActionAssertionError(
          `Expected action "${kind}" to be dispatched ${n} time(s); was ${matching.length}.`,
          { kind, expected: n, actual: matching.length, calls: mock.calls }
        );
      }
    },
    atLeastOnce() {
      if (matching.length < 1) {
        throw new ActionAssertionError(
          `Expected action "${kind}" to be dispatched at least once; was never.`,
          { kind, calls: mock.calls }
        );
      }
    },
  };

  return api;
}
