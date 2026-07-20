/**
 * @file guard-decision.type.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Decision union returned by a guard's `canActivate(...)`.
 */

/**
 * Structured decision a guard may return. `true` / `false` remain the
 * short-forms and cover 90% of cases; the object forms let a guard
 * emit a redirect / notFound / abort signal directly.
 */
export type IGuardDecision =
  | { readonly allow: true }
  | { readonly deny: true; readonly reason?: string; readonly status?: number }
  | { readonly redirect: string; readonly status?: number }
  | { readonly notFound: true; readonly message?: string }
  | { readonly abort: Response };
