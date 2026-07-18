/**
 * @file http.reporter.ts
 * @module @stackra/logger/react/reporters
 * @description HTTP reporter — batches log entries and POSTs them to a
 *   configured remote endpoint. Designed for browser/React Native environments
 *   where logs need to be shipped to a centralized logging service.
 */

import { type ILogReporter, type ILogEntry } from "@stackra/contracts";
import { Reporter } from "@/core/decorators/reporter.decorator";

import type { IHttpReporterConfig } from "@/react/interfaces/http-reporter-config.interface";

export type { IHttpReporterConfig };

/**
 * HTTP reporter — batches log entries and ships them to a remote endpoint.
 *
 * Designed for client-side environments (browser, React Native) where logs
 * need to be forwarded to a backend logging service. Entries are buffered
 * in memory and flushed when the batch size is reached or the interval fires.
 *
 * Uses `globalThis.fetch` for transport. If fetch is unavailable (e.g., old
 * environments), entries are silently dropped.
 *
 * @example
 * ```typescript
 * const httpReporter = new HttpReporter({
 *   endpoint: 'https://logs.myapp.com/ingest',
 *   batchSize: 20,
 *   flushIntervalMs: 10000,
 *   headers: { 'X-API-Key': 'secret' },
 * });
 * manager.registerReporter(httpReporter);
 * ```
 */
@Reporter("http")
export class HttpReporter implements ILogReporter {
  /** Reporter identifier. */
  public readonly name = "http";

  /** Buffered entries waiting to be flushed. */
  private buffer: ILogEntry[] = [];

  /** Interval ID for periodic flush. */
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Resolved batch size. */
  private readonly batchSize: number;

  /** Resolved flush interval in ms. */
  private readonly flushIntervalMs: number;

  /** Resolved endpoint URL. */
  private readonly endpoint: string;

  /** Resolved headers. */
  private readonly headers: Record<string, string>;

  /**
   * @param config - HTTP reporter configuration
   */
  public constructor(config: IHttpReporterConfig) {
    this.endpoint = config.endpoint;
    this.batchSize = config.batchSize ?? 10;
    this.flushIntervalMs = config.flushIntervalMs ?? 5000;
    this.headers = config.headers ?? {};

    // Start periodic flush interval
    if (typeof setInterval !== "undefined") {
      this.intervalId = setInterval(() => {
        this.flushBuffer();
      }, this.flushIntervalMs);
    }
  }

  /**
   * Buffer a log entry for batched transmission.
   * Flushes immediately when the batch size threshold is reached.
   *
   * @param entry - Structured log entry
   */
  public write(entry: ILogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flushBuffer();
    }
  }

  /**
   * Flush all buffered entries to the remote endpoint.
   * Clears the interval timer.
   *
   * @returns Promise that resolves when the flush request completes
   */
  public async flush(): Promise<void> {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    await this.flushBuffer();
  }

  /**
   * Send buffered entries to the remote endpoint via POST.
   * Silently swallows errors — log shipping must never crash the app.
   */
  private flushBuffer(): void {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.slice();
    this.buffer = [];

    const payload = entries.map((entry) => ({
      timestamp: entry.timestamp,
      level: entry.level,
      context: entry.context,
      message: entry.message,
      meta: entry.meta,
      error: entry.error
        ? { name: entry.error.name, message: entry.error.message, stack: entry.error.stack }
        : undefined,
    }));

    // Fire-and-forget POST
    if (typeof globalThis.fetch === "function") {
      globalThis
        .fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.headers,
          },
          body: JSON.stringify({ entries: payload }),
          keepalive: true,
        })
        .catch(() => {
          // Silently drop — log shipping errors must not propagate
        });
    }
  }
}
