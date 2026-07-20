/**
 * Cache interceptor.
 *
 * GET-only HTTP response cache layered on `@stackra/cache`. Stores
 * responses with optional ETag for conditional revalidation, parses
 * `Cache-Control: max-age` for TTL when configured, and exposes
 * tag-based invalidation through {@link invalidateTags}.
 *
 * @module @stackra/http/interceptors/cache
 */

import { Inject, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";

import {
  CACHE_MANAGER,
  HTTP_CONFIG,
  HttpMethod,
  type IHttpContext,
  type IHttpInterceptor,
  type IHttpModuleOptions,
  type IHttpNextFunction,
  type IHttpRequestConfig,
  type IHttpResponse,
} from "@stackra/contracts";

import { HttpInterceptor } from "../decorators/http-interceptor.decorator";
import { HttpCacheError } from "../errors";

/**
 * Cached response wrapper.
 */
interface ICachedResponse {
  /** Original response. */
  response: IHttpResponse;
  /** ETag for conditional requests, when present. */
  etag?: string;
  /** Epoch ms expiration. `null` = no expiration. */
  expiresAt: number | null;
}

/**
 * Tagged-cache shape we depend on (subset of `@stackra/cache`).
 */
interface ITaggedCacheLike {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  flush(): Promise<void>;
}

/**
 * Cache-manager shape we depend on.
 */
interface ICacheManagerLike {
  tags(tags: string[]): ITaggedCacheLike;
}

/**
 * Cache interceptor.
 */
@HttpInterceptor({ priority: 60, name: "cache" })
export class CacheInterceptor implements IHttpInterceptor {
  /** Scoped logger. */
  private readonly logger = new Logger(CacheInterceptor.name);

  /**
   * @param config - Module options.
   * @param cache  - Optional cache manager from `@stackra/cache`.
   */
  public constructor(
    @Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions,
    @Optional() @Inject(CACHE_MANAGER) private readonly cache?: ICacheManagerLike,
  ) {}

  /** @inheritdoc */
  public async intercept(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const cacheConfig = this.config.connections[this.config.default]?.cache;
    if (!cacheConfig?.enabled || !this.cache) return next(context);
    if (context.request.method !== HttpMethod.GET) return next(context);
    if (context.request.meta?.["skipCache"] === true) return next(context);
    if (this.shouldExclude(context.request.url ?? "")) return next(context);

    try {
      return await this.handleCachedRequest(context, next);
    } catch (err: Error | any) {
      this.logger.error("cache operation failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return next(context);
    }
  }

  /**
   * Drop cached entries matching tag set. Convenience wrapper over
   * the underlying cache manager's flush.
   *
   * @param tags - Tags to invalidate.
   */
  public async invalidateTags(tags: string[]): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.tags(tags).flush();
    } catch (err: Error | any) {
      throw new HttpCacheError(`Failed to invalidate tags: ${tags.join(", ")}`, err as Error);
    }
  }

  /** Cache-aware request handling. */
  private async handleCachedRequest(
    context: IHttpContext,
    next: IHttpNextFunction,
  ): Promise<IHttpResponse> {
    const cache = this.cache!;
    const cacheKey = this.cacheKey(context.request);
    const tags = this.tagsFor(context.request);

    const cached = await cache.tags(tags).get<ICachedResponse>(cacheKey);

    if (cached && !this.expired(cached)) {
      this.logger.debug(`cache HIT ${cacheKey}`);
      return cached.response;
    }

    if (cached?.etag) {
      context.request.headers = {
        ...context.request.headers,
        "If-None-Match": cached.etag,
      };
    }

    const response = await next(context);

    if (response.status === 304 && cached) {
      return cached.response;
    }

    const ttlMs = this.resolveTtl(response);
    if (ttlMs > 0) {
      const etag = response.headers?.["etag"];
      const value: ICachedResponse = {
        response,
        ...(etag !== undefined ? { etag } : {}),
        expiresAt: Date.now() + ttlMs,
      };
      await cache.tags(tags).put(cacheKey, value, Math.ceil(ttlMs / 1000));
      this.logger.debug(`cache STORE ${cacheKey} (ttl ${ttlMs}ms)`);
    }

    return response;
  }

  /** `http:{METHOD}:{URL}:{params}` */
  private cacheKey(request: IHttpRequestConfig): string {
    const params = request.params ? JSON.stringify(request.params) : "";
    return `http:${request.method ?? "GET"}:${request.url ?? ""}:${params}`;
  }

  /** Build the tag set for a request. */
  private tagsFor(request: IHttpRequestConfig): string[] {
    const tags: string[] = ["api"];
    if (request.url) {
      const segments = request.url.split("/").filter(Boolean);
      if (segments.length > 0 && segments[0]) tags.push(segments[0]);
    }
    const custom = request.meta?.["cacheTags"] as string[] | undefined;
    if (Array.isArray(custom)) tags.push(...custom);
    return tags;
  }

  /** Whether a cached entry has expired. */
  private expired(cached: ICachedResponse): boolean {
    if (cached.expiresAt === null) return false;
    return Date.now() > cached.expiresAt;
  }

  /** Resolve TTL from response or fall back to config default. */
  private resolveTtl(response: IHttpResponse): number {
    const cacheConfig = this.config.connections[this.config.default]?.cache;
    const fallback = cacheConfig?.ttl ?? 0;

    if (cacheConfig?.respectCacheControl) {
      const cacheControl = response.headers?.["cache-control"];
      if (cacheControl) {
        const match = /max-age=(\d+)/.exec(cacheControl);
        if (match?.[1]) return Number.parseInt(match[1], 10) * 1000;
      }
    }

    return fallback;
  }

  /** URL-pattern exclusion check. */
  private shouldExclude(url: string): boolean {
    const cacheConfig = this.config.connections[this.config.default]?.cache;
    const patterns = cacheConfig?.excludePatterns ?? [];
    return patterns.some((pattern) => pattern.test(url));
  }
}
