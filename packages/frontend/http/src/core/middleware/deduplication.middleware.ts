/**
 * @file deduplication.middleware.ts
 * Deduplication middleware.
 *
 * Shares a single Promise across identical in-flight requests so
 * concurrent callers all receive the same response without making
 * extra network round-trips.
 *
 * Skip per-request via `meta.skipDeduplication: true`.
 *
 * @module @stackra/http/middleware/deduplication
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

/**
 * Deduplication middleware.
 */
@HttpMiddleware({ priority: 50, name: "deduplication" })
export class DeduplicationMiddleware implements IHttpMiddleware {
  /** Active in-flight promises keyed by request key. */
  private readonly pending: Map<string, Promise<IHttpResponse>> = new Map();

  /**
   * @param config - Module options.
   */
  public constructor(@Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions) {}

  /** @inheritdoc */
  public async handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const defaultConn = this.config.connections[this.config.default];
    const dedup = defaultConn?.deduplication;
    if (!dedup?.enabled) {
      return next(context);
    }

    if (context.request.meta?.["skipDeduplication"] === true) {
      return next(context);
    }

    const key = dedup.keyGenerator
      ? dedup.keyGenerator(context.request)
      : DeduplicationMiddleware.defaultKey(context.request);

    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;

    const promise = next(context).finally(() => {
      this.pending.delete(key);
    });
    this.pending.set(key, promise);
    return promise;
  }

  /** Default `{METHOD}:{URL}:{params}` key. */
  private static defaultKey(request: IHttpRequestConfig): string {
    const params = request.params ? JSON.stringify(request.params) : "";
    return `${request.method ?? "GET"}:${request.url ?? ""}:${params}`;
  }

  /** Read the active in-flight count (debug helper). */
  public getInFlightCount(): number {
    return this.pending.size;
  }

  /** Read every active key (debug helper). */
  public getInFlightKeys(): string[] {
    return Array.from(this.pending.keys());
  }

  /** Drop every tracked promise. Does not cancel underlying requests. */
  public clear(): void {
    this.pending.clear();
  }
}
