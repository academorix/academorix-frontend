/**
 * @file tenant-header.middleware.ts
 * @module @stackra/http/middleware
 * @description Injects the X-Tenant-Id header from the current scope context
 *   into every outgoing HTTP request. Relies on `IScopeContextStore` from
 *   `@stackra/contracts` to read the active owner ID. Requests can opt out
 *   via `meta.skipTenant: true`.
 */

import { Inject, Optional } from '@stackra/container';

import type {
  IHttpContext,
  IHttpMiddleware,
  IHttpNextFunction,
  IHttpResponse,
} from '@stackra/contracts';

import { HttpMiddleware } from '../decorators/http-middleware.decorator';
import { SCOPE_CONTEXT_STORE, type IScopeContextStore } from '../integrations';

/**
 * Tenant header middleware.
 *
 * Reads the current scope's `ownerId` (which represents the tenant/organization)
 * and attaches it as the `X-Tenant-Id` header on outgoing requests. Skipped
 * when no scope context store is configured or when the request opts out.
 *
 * Priority 15: runs after auth (10) so the token is already attached,
 * but before rate-limiting and other pre-handler middleware.
 *
 * @example
 * ```typescript
 * // Opt out for a specific request:
 * http.get('/public/health', { meta: { skipTenant: true } });
 * ```
 */
@HttpMiddleware({ priority: 15, name: 'tenant-header' })
export class TenantHeaderMiddleware implements IHttpMiddleware {
  /**
   * @param scopeStore - Optional scope context store for reading current tenant.
   */
  public constructor(
    @Optional() @Inject(SCOPE_CONTEXT_STORE) private readonly scopeStore?: IScopeContextStore
  ) {}

  /**
   * Inject the X-Tenant-Id header and delegate to the next handler.
   *
   * @param context - HTTP request context
   * @param next - Next handler in the middleware chain
   * @returns The HTTP response
   */
  public async handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    if (!this.scopeStore) {
      return next(context);
    }

    if (context.request.meta?.['skipTenant'] === true) {
      return next(context);
    }

    const scopeContext = this.scopeStore.get();
    if (scopeContext?.ownerId) {
      context.request.headers = {
        ...context.request.headers,
        'X-Tenant-Id': scopeContext.ownerId,
      };
    }

    return next(context);
  }
}
