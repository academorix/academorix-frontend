/**
 * @file circuit-breaker.middleware.ts
 * Circuit-breaker middleware.
 *
 * Per-endpoint failure isolator. Reads the `CircuitBreakerService`
 * for the dispatched endpoint — when the breaker is `Open`, fails
 * the request fast with `CircuitBreakerOpenError`. Records every
 * downstream success/failure to feed the breaker.
 *
 * Skip per-request via `meta.skipCircuitBreaker: true`.
 *
 * @module @stackra/http/middleware/circuit-breaker
 */

import { Inject } from "@stackra/container";

import {
  HTTP_CONFIG,
  type IHttpContext,
  type IHttpMiddleware,
  type IHttpModuleOptions,
  type IHttpNextFunction,
  type IHttpRequestConfig,
  type IHttpResponse,
} from "@stackra/contracts";

import { HttpMiddleware } from "../decorators/http-middleware.decorator";
import { CircuitBreakerOpenError } from "../errors";
import { CircuitBreakerService } from "../services/circuit-breaker.service";

/**
 * Circuit-breaker middleware.
 */
@HttpMiddleware({ priority: 40, name: "circuit-breaker" })
export class CircuitBreakerMiddleware implements IHttpMiddleware {
  /**
   * @param config   - Module options.
   * @param breakers - Per-endpoint breaker service.
   */
  public constructor(
    @Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions,
    private readonly breakers: CircuitBreakerService,
  ) {}

  /** @inheritdoc */
  public async handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const defaultConn = this.config.connections[this.config.default];
    if (!defaultConn?.circuitBreaker?.enabled) {
      return next(context);
    }

    if (context.request.meta?.["skipCircuitBreaker"] === true) {
      return next(context);
    }

    const endpoint = CircuitBreakerMiddleware.endpointKey(context.request);
    const breaker = this.breakers.getBreaker(endpoint);

    if (breaker.isOpen()) {
      throw new CircuitBreakerOpenError(`Circuit breaker is OPEN for ${endpoint} — failing fast.`);
    }

    try {
      const response = await next(context);
      breaker.recordSuccess();
      return response;
    } catch (err: Error | any) {
      breaker.recordFailure();
      throw err;
    }
  }

  /** Build the `"{METHOD}:{URL}"` lookup key. */
  private static endpointKey(request: IHttpRequestConfig): string {
    return `${request.method ?? "GET"}:${request.url ?? ""}`;
  }
}
