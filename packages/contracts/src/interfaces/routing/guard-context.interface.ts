/**
 * @file guard-context.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Context passed to a guard's `canActivate(...)` method.
 */

import type { IApplication } from "../container";
import type { IMatchDescriptor } from "./match-descriptor.interface";

/**
 * Runtime context supplied to guard invocation.
 *
 * @typeParam TState - Shape of the shared mutable state bag routed
 *   through the pipeline. Guards may attach fields (e.g. the resolved
 *   `user` after `AuthGuard`) that downstream guards + middleware
 *   read.
 */
export interface IGuardContext<TState = Record<string, unknown>> {
  /** The active `Request`. */
  readonly request: Request;

  /** Parsed URL — convenience over `new URL(request.url)`. */
  readonly url: URL;

  /** Path params for the matched route. */
  readonly params: Readonly<Record<string, string>>;

  /** Match chain — every match up to (and including) the guarded route. */
  readonly matches: readonly IMatchDescriptor[];

  /** DI container — dependency lookups from within the guard. */
  readonly container: IApplication;

  /**
   * Shared mutable state bag. Guards may attach fields that later
   * guards + middleware read. NOT readonly.
   */
  state: TState;
}
