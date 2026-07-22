/**
 * @file token-bucket.service.ts
 * TokenBucketService.
 *
 * Implements the token-bucket algorithm for client-side rate
 * limiting. One bucket per endpoint, refilled at a configured rate.
 * `consume()` resolves immediately when a token is available and
 * waits otherwise, processing waiters in FIFO order on refill.
 *
 * @module @stackra/http/services/token-bucket
 */

import { Injectable } from "@stackra/container";

import type { IHttpRateLimitEndpointConfig } from "@stackra/contracts";

/**
 * Single bucket — one per `(connection, method, url)`.
 */
class TokenBucket {
  /** Current token count. May be fractional. */
  private tokens: number;

  /** Last refill timestamp (epoch ms). */
  private lastRefill: number = Date.now();

  /** Maximum capacity (tokens). */
  private readonly capacity: number;

  /** Refill rate (tokens / second). */
  private readonly refillRate: number;

  /** Pending waiters resolved in FIFO order. */
  private readonly waitQueue: Array<() => void> = [];

  /** Active refill scheduler timer (cleared on stop). */
  private refillTimer: ReturnType<typeof setTimeout> | null = null;

  public constructor(config: IHttpRateLimitEndpointConfig) {
    this.capacity = config.requestsPerWindow;
    this.refillRate = config.refillRate;
    this.tokens = this.capacity;
  }

  /** Acquire one token, waiting when necessary. */
  public async consume(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
      this.scheduleRefill();
    });
  }

  /** Read the current token count after refill. */
  public getTokenCount(): number {
    this.refill();
    return this.tokens;
  }

  /** Read the current wait queue size. */
  public getWaitQueueSize(): number {
    return this.waitQueue.length;
  }

  /** Add tokens proportional to elapsed time and process the queue. */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    const refilled = elapsedSeconds * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + refilled);
    this.lastRefill = now;

    while (this.tokens >= 1 && this.waitQueue.length > 0) {
      this.tokens -= 1;
      const resolve = this.waitQueue.shift();
      resolve?.();
    }
  }

  /** Schedule the next refill. Idempotent. */
  private scheduleRefill(): void {
    if (this.refillTimer !== null) return;

    const delayMs = (1 / this.refillRate) * 1000;
    this.refillTimer = setTimeout(() => {
      this.refillTimer = null;
      this.refill();
      if (this.waitQueue.length > 0) {
        this.scheduleRefill();
      }
    }, delayMs);
  }
}

/**
 * Per-endpoint token bucket service.
 */
@Injectable()
export class TokenBucketService {
  /** Active buckets keyed by endpoint identifier. */
  private readonly buckets: Map<string, TokenBucket> = new Map();

  /**
   * Acquire one token for the named endpoint, creating the bucket on
   * first call.
   *
   * @param endpoint - Endpoint identifier (`"{METHOD}:{URL}"`).
   * @param config   - Bucket configuration.
   */
  public async consume(endpoint: string, config: IHttpRateLimitEndpointConfig): Promise<void> {
    let bucket = this.buckets.get(endpoint);
    if (!bucket) {
      bucket = new TokenBucket(config);
      this.buckets.set(endpoint, bucket);
    }
    await bucket.consume();
  }

  /**
   * Read the current token count for an endpoint, or `null` when no
   * bucket exists yet.
   *
   * @param endpoint - Endpoint identifier.
   */
  public getTokenCount(endpoint: string): number | null {
    return this.buckets.get(endpoint)?.getTokenCount() ?? null;
  }

  /**
   * Read the wait-queue size for an endpoint.
   *
   * @param endpoint - Endpoint identifier.
   */
  public getWaitQueueSize(endpoint: string): number | null {
    return this.buckets.get(endpoint)?.getWaitQueueSize() ?? null;
  }

  /** Drop every bucket. */
  public clear(): void {
    this.buckets.clear();
  }
}
