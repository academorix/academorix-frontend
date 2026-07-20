/**
 * HttpClient.
 *
 * Concrete `IHttpClient` for one connection. Built by `HttpManager`
 * during connection resolution and cached. Carries:
 *
 * - the connection's `IHttpClientConfig` (effective base URL, headers,
 *   timeout, opt-in middleware/interceptor switches),
 * - the connector resolved from the driver registry,
 * - the per-connection middleware + interceptor pipelines.
 *
 * Unary methods (`get`/`post`/...) build a context, run it through
 * middleware → interceptors → connector terminal handler, and
 * return the response. Streaming methods (`stream`, `sse`) build a
 * context, run the same middleware chain, then open the connector
 * stream and yield decoded values.
 *
 * @module @stackra/http/services/http-client
 */

import { Logger } from "@stackra/logger";

import {
  HTTP_EVENTS,
  HttpStreamFormat,
  type IEventEmitter,
  type IHttpClient,
  type IHttpClientConfig,
  type IHttpConnector,
  type IHttpContext,
  type IHttpInterceptorRegistry,
  type IHttpMiddlewareRegistry,
  type IHttpRequestConfig,
  type IHttpResponse,
  type IHttpStream,
  type ISseConfig,
  type ISseEvent,
  type IStreamConfig,
} from "@stackra/contracts";

import { DEFAULT_TIMEOUT_MS } from "../constants";
import { HttpStreamError } from "../errors";
import type { IHttpClientDeps } from "../interfaces/http-client-deps.interface";
import { createStreamParser, SseStreamParser } from "../parsers";
import { composeBaseURL } from "../utils";

import { InterceptorPipeline } from "./interceptor-pipeline.service";
import { MiddlewarePipeline } from "./middleware-pipeline.service";

/**
 * Concrete `IHttpClient` implementation.
 */
export class HttpClient implements IHttpClient {
  /** Scoped logger. */
  private readonly logger: InstanceType<typeof Logger>;

  /** Connection name. */
  private readonly name: string;

  /** Connection configuration. */
  private readonly config: IHttpClientConfig;

  /** Resolved connector. */
  private readonly connector: IHttpConnector;

  /** Middleware registry. */
  private readonly middlewareRegistry: IHttpMiddlewareRegistry;

  /** Interceptor registry. */
  private readonly interceptorRegistry: IHttpInterceptorRegistry;

  /** Optional event emitter. */
  private readonly eventEmitter?: IEventEmitter;

  /** Cached effective base URL. */
  private readonly effectiveBaseURL?: string;

  /** Reusable middleware pipeline executor. */
  private readonly middlewarePipeline: MiddlewarePipeline = new MiddlewarePipeline();

  /** Reusable interceptor pipeline executor. */
  private readonly interceptorPipeline: InterceptorPipeline = new InterceptorPipeline();

  /**
   * @param deps - Pre-resolved dependencies from the manager.
   */
  public constructor(deps: IHttpClientDeps) {
    this.name = deps.name;
    this.config = deps.config;
    this.connector = deps.connector;
    this.middlewareRegistry = deps.middlewareRegistry;
    this.interceptorRegistry = deps.interceptorRegistry;
    if (deps.eventEmitter !== undefined) this.eventEmitter = deps.eventEmitter;

    this.logger = new Logger(`HttpClient[${deps.name}]`);
    this.effectiveBaseURL = composeBaseURL(
      deps.config.baseURL,
      deps.config.apiPrefix,
      deps.config.version,
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Unary requests
  // ────────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async get<T = unknown>(
    url: string,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.executeRequest<T>({ ...config, url, method: "GET" });
  }

  /** @inheritdoc */
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.executeRequest<T>({ ...config, url, method: "POST", data });
  }

  /** @inheritdoc */
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.executeRequest<T>({ ...config, url, method: "PUT", data });
  }

  /** @inheritdoc */
  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.executeRequest<T>({ ...config, url, method: "PATCH", data });
  }

  /** @inheritdoc */
  public async delete<T = unknown>(
    url: string,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>> {
    return this.executeRequest<T>({ ...config, url, method: "DELETE" });
  }

  /** @inheritdoc */
  public async request<T = unknown>(config: IHttpRequestConfig): Promise<IHttpResponse<T>> {
    return this.executeRequest<T>(config);
  }

  // ────────────────────────────────────────────────────────────────────
  // Streaming
  // ────────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public stream<T = unknown>(url: string, config?: IStreamConfig): IHttpStream<T> {
    const format = config?.format ?? HttpStreamFormat.Sse;
    return this.openStream<T>({ ...config, url, method: config?.method ?? "GET" }, format);
  }

  /** @inheritdoc */
  public sse<T = unknown>(url: string, config?: ISseConfig): IHttpStream<ISseEvent<T>> {
    return this.openStream<ISseEvent<T>>(
      {
        ...config,
        url,
        method: config?.method ?? "GET",
        headers: { Accept: "text/event-stream", ...config?.headers },
      },
      HttpStreamFormat.Sse,
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — unary execution
  // ────────────────────────────────────────────────────────────────────

  /**
   * Build a context, run middleware → interceptors → connector,
   * emit lifecycle events around the run.
   */
  private async executeRequest<T>(perRequestConfig: IHttpRequestConfig): Promise<IHttpResponse<T>> {
    const merged = this.mergeRequestConfig(perRequestConfig);
    const context: IHttpContext = {
      request: merged,
      metadata: new Map<string, unknown>(),
    };

    const startedAt = Date.now();
    this.emitEvent(HTTP_EVENTS.REQUEST_START, {
      connection: this.name,
      method: merged.method,
      url: merged.url,
    });

    try {
      const response = (await this.middlewarePipeline.execute(
        this.middlewareRegistry.getSorted(),
        context,
        (ctx) =>
          this.interceptorPipeline.execute(this.interceptorRegistry.getSorted(), ctx, (innerCtx) =>
            this.connector.send(innerCtx),
          ),
      )) as IHttpResponse<T>;

      this.emitEvent(HTTP_EVENTS.REQUEST_SUCCESS, {
        connection: this.name,
        method: merged.method,
        url: merged.url,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return response;
    } catch (err: Error | any) {
      this.emitEvent(HTTP_EVENTS.REQUEST_FAILED, {
        connection: this.name,
        method: merged.method,
        url: merged.url,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Merge per-request overrides on top of the connection defaults.
   */
  private mergeRequestConfig(perRequest: IHttpRequestConfig): IHttpRequestConfig {
    return {
      baseURL: this.effectiveBaseURL,
      timeout: this.config.timeout ?? DEFAULT_TIMEOUT_MS,
      ...perRequest,
      headers: { ...this.config.headers, ...perRequest.headers },
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — streaming execution
  // ────────────────────────────────────────────────────────────────────

  /**
   * Build the streaming pipeline. Returns an `IHttpStream` that runs
   * the connector lazily on first iteration so consumers can build
   * pipelines without firing requests.
   */
  private openStream<T>(perRequest: IHttpRequestConfig, format: HttpStreamFormat): IHttpStream<T> {
    const merged = this.mergeRequestConfig(perRequest);
    const controller = new AbortController();
    if (merged.signal) {
      // Combine the external signal with our cancellation handle.
      if (merged.signal.aborted) controller.abort();
      else merged.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const startedAt = Date.now();
    const self = this;

    async function* iterator(): AsyncIterableIterator<T> {
      const context: IHttpContext = {
        request: { ...merged, signal: controller.signal },
        metadata: new Map<string, unknown>(),
      };

      const parser = createStreamParser<T>(format);
      const sseParser =
        parser instanceof SseStreamParser ? (parser as SseStreamParser<unknown>) : null;
      void sseParser; // reserved for future last-event-id reconnection.

      self.emitEvent(HTTP_EVENTS.STREAM_OPEN, {
        connection: self.name,
        method: merged.method,
        url: merged.url,
      });

      try {
        // Run middleware/interceptors first so headers (auth, etc.)
        // are attached, then open the connector stream from the
        // resulting context.
        await self.middlewarePipeline.execute(
          self.middlewareRegistry.getSorted(),
          context,
          async (ctx) => {
            await self.interceptorPipeline.execute(
              self.interceptorRegistry.getSorted(),
              ctx,
              async () => ({
                data: undefined,
                status: 0,
                statusText: "STREAM_PENDING",
                headers: {},
                config: ctx.request,
              }),
            );
            return {
              data: undefined,
              status: 0,
              statusText: "STREAM_PENDING",
              headers: {},
              config: ctx.request,
            };
          },
        );

        const iterable = await self.connector.stream(context);
        for await (const chunk of iterable) {
          for (const value of parser.feed(chunk)) {
            yield value;
          }
        }
        for (const value of parser.flush()) {
          yield value;
        }
        self.emitEvent(HTTP_EVENTS.STREAM_CLOSE, {
          connection: self.name,
          method: merged.method,
          url: merged.url,
          durationMs: Date.now() - startedAt,
        });
      } catch (err: Error | any) {
        self.emitEvent(HTTP_EVENTS.STREAM_ERROR, {
          connection: self.name,
          method: merged.method,
          url: merged.url,
          durationMs: Date.now() - startedAt,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err instanceof HttpStreamError
          ? err
          : new HttpStreamError(`[HttpClient:${self.name}] stream failed`, err as Error);
      }
    }

    const it = iterator();

    const stream: IHttpStream<T> = {
      [Symbol.asyncIterator](): AsyncIterator<T> {
        return it;
      },
      cancel(): void {
        controller.abort();
        // Encourage the iterator to settle.
        it.return?.(undefined as never).catch(() => undefined);
      },
    };

    return stream;
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — events
  // ────────────────────────────────────────────────────────────────────

  /**
   * Safe emit. Swallows observer errors so a misbehaving subscriber
   * cannot break the request flow.
   */
  private emitEvent(event: string, payload: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch (err: Error | any) {
      this.logger.warn(`Event emission failed for "${event}"`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
