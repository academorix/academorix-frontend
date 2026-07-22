/**
 * @file index.ts
 * @module @stackra/actions/core/errors
 * @description Public API barrel for the `errors` category — re-exports every
 *   error class thrown from the actions dispatcher (base `ActionError`, plus
 *   the authorization and assertion specializations).
 */

export { ActionError } from "./action.error";
export { ActionAuthorizationError } from "./action-authorization.error";
export { ActionAssertionError } from "./action-assertion.error";
