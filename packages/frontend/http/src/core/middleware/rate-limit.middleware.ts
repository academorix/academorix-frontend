/**
 * Rate-limit middleware.
 *
 * Token-bucket-based throttling. Looks up the rate limit for the
 * dispatched endpoint, then awaits a token before forwarding.
 *
 * Skip per-request via `meta.skipRateLimit: true`.
 *
 * @module @stackra/http/middleware/rate-limit
 */

import { Inject } from "@stackra/container";

import {
  HTTP_CONFIG,
  type IHttpContext,
  type IHttpMiddleware,
  type IHttpModuleOptions,
  type IHttpNextFunction,
  type IHttpRateLimitEndpointConfig,
  type IHttpRequestConfig,
  type IHttpResponse,
} from "@stackra/contracts";

import { DEFAULT_RATE_LIMIT } from "../constants";
import { HttpMiddleware } from "../decorators/http-middleware.decorator";
import { TokenBucketService } from "../services/token-bucket.service";

/**
 * Rate-limit middleware.
 */
@HttpMiddleware({ priority: 30, name: "rate-limit" })
export class RateLimitMiddleware implements IHttpMiddleware {
  /**
   * @param config       - Module options. The default-connection's
   *   rate-limit settings are used as the global defaults; per-
   *   connection middleware can be wired through `forFeatureMiddleware`.
   * @param tokenBuckets - Per-endpoint bucket service.
   */
  public constructor(
    @Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions,
    private readonly tokenBuckets: TokenBucketService,
  ) {}

  /** @inheritdoc */
  public async handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const defaultConn = this.config.connections[this.config.default];
    const rateLimit = defaultConn?.rateLimit;

    if (!rateLimit?.enabled) {
      return next(context);
    }

    if (context.request.meta?.["skipRateLimit"] === true) {
      return next(context);
    }

    const endpoint = RateLimitMiddleware.endpointKey(context.request);
    const config: IHttpRateLimitEndpointConfig =
      rateLimit.endpoints?.[endpoint] ?? rateLimit.default ?? DEFAULT_RATE_LIMIT;

    await this.tokenBuckets.consume(endpoint, config);
    return next(context);
  }

  /** Build the `"{METHOD}:{URL}"` lookup key. */
  private static endpointKey(request: IHttpRequestConfig): string {
    return `${request.method ?? "GET"}:${request.url ?? ""}`;
  }
}
