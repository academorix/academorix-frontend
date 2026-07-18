/**
 * @file access-control-http.interceptor.ts
 * @module @academorix/access-control/errors
 *
 * @description
 * `@academorix/http` response interceptor that translates the
 * backend `AuthorizeControllerAction` middleware's 403 responses
 * into typed `AccessDeniedError` / `RoleMismatchError` exceptions
 * (from `@academorix/contracts`).
 */

import {
  AccessDeniedError,
  RoleMismatchError,
  type HttpResponseInterceptor,
} from "@academorix/contracts";

/**
 * Backend error envelope emitted by `AuthorizeControllerAction`.
 * See `academorix-backend/packages/authorization/src/Middleware/AuthorizeControllerAction.php`.
 */
interface IAuthorizationErrorBody {
  readonly message?: string;
  readonly code?: string;
  readonly context?: {
    readonly required?: readonly string[];
  };
}

/**
 * Build the response interceptor.
 *
 * @returns A response interceptor ready to add to `HttpModule.forRoot()`.
 */
export function buildAccessControlHttpInterceptor(): HttpResponseInterceptor {
  return async (response) => {
    if (response.status !== 403) {
      return response;
    }

    const cloned = response.clone();
    let body: IAuthorizationErrorBody = {};
    try {
      body = (await cloned.json()) as IAuthorizationErrorBody;
    } catch {
      return response;
    }

    const required = body.context?.required ?? [];
    const reason = body.message ?? "Access denied";

    if (body.code === "authorization.permission_required") {
      throw new AccessDeniedError(required, reason);
    }
    if (body.code === "authorization.role_required") {
      throw new RoleMismatchError(required, reason);
    }

    return response;
  };
}
