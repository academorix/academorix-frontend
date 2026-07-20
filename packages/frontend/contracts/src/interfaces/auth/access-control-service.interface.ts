/**
 * @file access-control-service.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description The permission / access-control service contract.
 *
 *   Implemented by `@stackra/auth`'s default `AccessControlService`
 *   and any caller-supplied override bound to
 *   {@link ACCESS_CONTROL_SERVICE}. Consumers (guards, UI, action
 *   handlers) inject the token and depend only on this shape.
 */

import type { ICanResponse } from "./can-response.interface";

/**
 * Access-control service contract.
 *
 * Guards ask "can this user perform this action on this resource?"
 * The implementation may resolve locally against a cached policy tree
 * or delegate to a backend API — that decision is opaque to callers.
 */
export interface IAccessControlService {
  /**
   * Check whether the current user may perform `action` on `resource`.
   *
   * @param checkParams - `{ resource, action, params? }`. `params` is
   *   opaque context passed through to the underlying policy (e.g.
   *   route params, resource id).
   */
  can(checkParams: { resource: string; action: string; params?: unknown }): Promise<ICanResponse>;
}
