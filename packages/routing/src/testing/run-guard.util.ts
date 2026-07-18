/**
 * @file run-guard.util.ts
 * @module @stackra/routing/testing
 * @description Invoke a guard's `canActivate(...)` in isolation.
 *
 *   Given a guard instance (or class + args) + a context, returns the
 *   guard's decision as a Promise. Throws from the guard body are
 *   re-thrown so tests can `.rejects.toThrow(...)`.
 */

import type { ICanActivate, IGuardContext, IGuardDecision } from "@stackra/contracts";

import {
  createMockGuardContext,
  type IMockGuardContextOverrides,
} from "./create-mock-guard-context.util";

/**
 * Invoke a guard's `canActivate(...)` in isolation.
 *
 * @param guard    - Guard INSTANCE (already constructed with its deps).
 * @param overrides - Optional context overrides — merged over defaults.
 * @returns Resolved guard decision (boolean or `IGuardDecision`).
 *
 * @example
 * ```typescript
 * import { runGuard } from '@stackra/routing/testing';
 *
 * const decision = await runGuard(new AuthGuard(fakeAuth), { url: '/dashboard' });
 * expect(decision).toEqual({ redirect: '/sign-in' });
 * ```
 */
export async function runGuard(
  guard: ICanActivate,
  overrides: IMockGuardContextOverrides = {},
): Promise<boolean | IGuardDecision> {
  const context = createMockGuardContext(overrides);
  // Guards may return a raw boolean, an IGuardDecision, or a Promise
  // of either. Awaiting collapses the union to the two sync shapes.
  return await guard.canActivate(context as IGuardContext);
}
