/**
 * Progress middleware.
 *
 * Wires upload/download progress callbacks on the request and
 * fans the events out to subscribers registered via
 * `onProgress(callback)`. Optional throttling caps emission rate.
 *
 * @module @stackra/http/middleware/progress
 */

import { Inject } from "@stackra/container";
import { Logger } from "@stackra/logger";

import {
  HTTP_CONFIG,
  type IHttpContext,
  type IHttpMiddleware,
  type IHttpModuleOptions,
  type IHttpNextFunction,
  type IHttpProgressEvent,
  type IHttpProgressListener,
  type IHttpResponse,
} from "@stackra/contracts";

import { HttpMiddleware } from "../decorators/http-middleware.decorator";

/**
 * Progress middleware.
 */
@HttpMiddleware({ priority: 80, name: "progress" })
export class ProgressMiddleware implements IHttpMiddleware {
  /** Scoped logger. */
  private readonly logger = new Logger(ProgressMiddleware.name);

  /** Active subscribers. */
  private readonly subscribers: Set<IHttpProgressListener> = new Set();

  /** Monotonic counter for unique request ids. */
  private requestCounter: number = 0;

  /** Active throttle timers keyed by `requestId:type`. */
  private readonly throttleTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * @param config - Module options.
   */
  public constructor(@Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions) {}

  /** @inheritdoc */
  public async handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const defaultConn = this.config.connections[this.config.default];
    if (!defaultConn?.progress?.enabled) {
      return next(context);
    }

    const requestId = this.generateRequestId();

    context.request.onUploadProgress = (raw: unknown) => {
      const evt = raw as { loaded?: number; total?: number };
      this.emit({
        requestId,
        type: "upload",
        loaded: evt.loaded ?? 0,
        total: evt.total ?? 0,
        percentage: evt.total ? ((evt.loaded ?? 0) / evt.total) * 100 : 0,
      });
    };

    context.request.onDownloadProgress = (raw: unknown) => {
      const evt = raw as { loaded?: number; total?: number };
      this.emit({
        requestId,
        type: "download",
        loaded: evt.loaded ?? 0,
        total: evt.total ?? 0,
        percentage: evt.total ? ((evt.loaded ?? 0) / evt.total) * 100 : 0,
      });
    };

    return next(context);
  }

  /**
   * Subscribe to progress events.
   *
   * @param callback - Event listener.
   * @returns Unsubscribe function.
   */
  public onProgress(callback: IHttpProgressListener): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /** Active subscriber count (debug helper). */
  public getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /** Drop every subscriber. */
  public clearSubscribers(): void {
    this.subscribers.clear();
  }

  /** Generate a unique request id. */
  private generateRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`;
  }

  /** Emit one event with optional throttling. */
  private emit(event: IHttpProgressEvent): void {
    const defaultConn = this.config.connections[this.config.default];
    const throttle = defaultConn?.progress?.throttle;

    if (throttle !== undefined && throttle > 0) {
      const key = `${event.requestId}:${event.type}`;
      if (this.throttleTimers.has(key)) return;
      this.throttleTimers.set(
        key,
        setTimeout(() => this.throttleTimers.delete(key), throttle),
      );
    }

    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (err: Error | any) {
        this.logger.warn("progress subscriber threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
