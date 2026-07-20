/**
 * Auth middleware.
 *
 * Injects Bearer tokens into outgoing requests via the
 * `ITokenProvider` bound at `HTTP_TOKEN_PROVIDER`. On 401 responses,
 * refreshes the token (optionally under a cross-tab lock when
 * `@stackra/coordinator` is registered) and retries once.
 *
 * Requests can opt out by setting `meta.skipAuth: true`.
 *
 * @module @stackra/http/middleware/auth
 */

import { Inject, Optional } from "@stackra/container";

import {
  HTTP_TOKEN_PROVIDER,
  TAB_LOCK_MANAGER,
  type IHttpContext,
  type IHttpMiddleware,
  type IHttpNextFunction,
  type IHttpResponse,
  type ITokenProvider,
} from "@stackra/contracts";

import { HttpMiddleware } from "../decorators/http-middleware.decorator";

/**
 * Minimal `LockManager` shape used here. Avoids a hard import on
 * `@stackra/coordinator` so the auth middleware works in apps
 * without the coordinator package.
 */
interface ILockManagerLike {
  /**
   * Run a critical section under a named lock.
   *
   * @typeParam T - Return value of `task`.
   * @param name    - Lock name.
   * @param task    - Critical section.
   * @param options - Optional timeout etc.
   */
  run<T>(name: string, task: () => Promise<T>, options?: { timeoutMs?: number }): Promise<T>;
}

/**
 * Bearer-token auth middleware.
 */
@HttpMiddleware({ priority: 10, name: "auth" })
export class AuthMiddleware implements IHttpMiddleware {
  /**
   * @param tokenProvider - Token provider (optional — no-op when not configured).
   * @param lockManager   - Optional cross-tab lock manager.
   */
  public constructor(
    @Optional() @Inject(HTTP_TOKEN_PROVIDER) private readonly tokenProvider?: ITokenProvider,
    @Optional() @Inject(TAB_LOCK_MANAGER) private readonly lockManager?: ILockManagerLike,
  ) {}

  /** @inheritdoc */
  public async handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    // No-op when no token provider is configured (e.g., public-facing apps)
    if (!this.tokenProvider) {
      return next(context);
    }

    if (context.request.meta?.["skipAuth"] === true) {
      return next(context);
    }

    await this.injectToken(context);

    try {
      return await next(context);
    } catch (err: Error | any) {
      if (this.isUnauthorized(err)) {
        return this.handleUnauthorized(context, next);
      }
      throw err;
    }
  }

  /** Attach the Bearer token to the request. */
  private async injectToken(context: IHttpContext): Promise<void> {
    if (!this.tokenProvider) return;
    const token = await this.tokenProvider.getAccessToken();
    if (!token) return;

    context.request.headers = {
      ...context.request.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Refresh the token (under a lock when available) and retry once.
   */
  private async handleUnauthorized(
    context: IHttpContext,
    next: IHttpNextFunction,
  ): Promise<IHttpResponse> {
    const provider = this.tokenProvider;
    if (!provider) return next(context);

    const newToken = this.lockManager
      ? await this.lockManager.run<string>("http:token-refresh", () => provider.refresh(), {
          timeoutMs: 10_000,
        })
      : await provider.refresh();

    context.request.headers = {
      ...context.request.headers,
      Authorization: `Bearer ${newToken}`,
    };

    return next(context);
  }

  /** Whether `err` is a normalized 401. */
  private isUnauthorized(err: unknown): boolean {
    if (typeof err !== "object" || err === null) return false;
    const code = (err as { statusCode?: number }).statusCode;
    return code === 401;
  }
}
