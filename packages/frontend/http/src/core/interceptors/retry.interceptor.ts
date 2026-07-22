/**
 * @file retry.interceptor.ts
 * Retry interceptor.
 *
 * Retries on 5xx server errors and network errors with backoff
 * driven by `retry()` from `@stackra/support`. Client errors (4xx)
 * and explicit cancellations never retry. Per-request overrides via
 * `meta.maxRetries` and `meta.retryBackoff` (a per-attempt delay
 * array).
 *
 * @module @stackra/http/interceptors/retry
 */

import { Inject, Optional } from "@stackra/container";

import {
  EVENT_EMITTER,
  HTTP_EVENTS,
  type IEventEmitter,
  type IHttpContext,
  type IHttpInterceptor,
  type IHttpNextFunction,
  type IHttpResponse,
} from "@stackra/contracts";
import { retry } from "@stackra/support";

import { DEFAULT_MAX_RETRIES, DEFAULT_RETRY_BACKOFF } from "../constants";
import { HttpInterceptor } from "../decorators/http-interceptor.decorator";

/**
 * Retry interceptor.
 */
@HttpInterceptor({ priority: 20, name: "retry" })
export class RetryInterceptor implements IHttpInterceptor {
  /**
   * @param eventEmitter - Optional emitter for retry lifecycle events.
   */
  public constructor(
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter,
  ) {}

  /** @inheritdoc */
  public async intercept(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const meta = context.request.meta ?? {};
    const maxRetries = (meta["maxRetries"] as number | undefined) ?? DEFAULT_MAX_RETRIES;
    const backoff = (meta["retryBackoff"] as number[] | undefined) ?? DEFAULT_RETRY_BACKOFF;

    // `retry({ times })` counts total attempts INCLUDING the first —
    // maxRetries is the number of RE-tries, so the total is +1.
    return retry(() => next(context), {
      times: maxRetries + 1,
      delay: backoff,
      when: (err) => this.isRetryable(err),
      onRetry: (attempt, delayMs, err) => {
        // `attempt` here is the attempt number we're ABOUT to run
        // (2 = first retry). Subtract one to keep the emitted
        // `attempt` field's semantic ("1 = first retry") consistent
        // with the previous inline implementation.
        this.emit(HTTP_EVENTS.REQUEST_RETRY, {
          method: context.request.method,
          url: context.request.url,
          attempt: attempt - 1,
          delayMs,
          error: err.message,
        });
      },
    });
  }

  /** Retryable: network errors (status 0) or 5xx. */
  private isRetryable(err: unknown): boolean {
    if (typeof err !== "object" || err === null) return false;
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 0) return true;
    if (status !== undefined && status >= 500 && status < 600) return true;
    return false;
  }

  /** Best-effort lifecycle event emission. */
  private emit(event: string, payload: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch {
      /* swallow — observer errors must not affect retry behaviour */
    }
  }
}
