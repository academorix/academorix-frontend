/**
 * @file action-authorization.error.ts
 * @module @stackra/actions/core/errors
 * @description ActionAuthorizationError — raised when authorization fails
 *   inside the middleware pipeline. Carries the offending permission
 *   string in its `context.permission` for downstream logging + UX.
 */

import { ActionError } from "./action.error";

/** Raised when authorization fails inside the middleware pipeline. */
export class ActionAuthorizationError extends ActionError {
  public constructor(permission: string, context?: Record<string, unknown>) {
    super(`Permission denied: ${permission}`, "ACTION_AUTHORIZATION_ERROR", {
      ...context,
      permission,
    });
    this.name = "ActionAuthorizationError";
  }
}
