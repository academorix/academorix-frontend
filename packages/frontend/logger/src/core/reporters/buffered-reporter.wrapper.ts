/**
 * @file buffered-reporter.wrapper.ts
 * @module @stackra/logger/core/reporters
 * @description Buffered reporter wrapper — batches log entries and flushes
 *   at a configurable threshold or time interval. Wraps any ILogReporter.
 */

import type { ILogReporter, ILogEntry } from "@stackra/contracts";

import type { IBufferedReporterOptions } from "@/core/interfaces/buffered-reporter-options.interface";

export type { IBufferedReporterOptions };

/**
 * Buffered reporter wrapper — batches writes for performance.
 *
 * Wraps any `ILogReporter` and holds entries in memory until either:
 * - The buffer reaches `bufferSize` entries
 * - The flush interval timer fires
 * - `flush()` is called explicitly (e.g., on shutdown)
 *
 * This reduces I/O overhead for high-throughput logging scenarios.
 *
 * @example
 * ```typescript
 * const buffered = new BufferedReporterWrapper(jsonReporter, {
 *   bufferSize: 50,
 *   flushIntervalMs: 3000,
 * });
 *
 * // Use buffered as a reporter — it batches writes automatically
 * manager.registerReporter(buffered);
 * ```
 */
export class BufferedReporterWrapper implements ILogReporter {
  /** Delegates to the wrapped reporter's name with a 'buffered:' prefix. */
  public readonly name: string;

  /** In-memory buffer of pending entries. */
  private buffer: ILogEntry[] = [];

  /** Resolved buffer size threshold. */
  private readonly bufferSize: number;

  /** Timer reference for interval-based flushing. */
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param inner - The underlying reporter to write to
   * @param options - Buffer configuration
   */
  public constructor(
    private readonly inner: ILogReporter,
    options: IBufferedReporterOptions = {},
  ) {
    this.name = `buffered:${inner.name}`;
    this.bufferSize = options.bufferSize ?? 100;

    const intervalMs = options.flushIntervalMs ?? 5000;
    this.flushTimer = setInterval(() => {
      this.drainBuffer();
    }, intervalMs);

    // Ensure the timer doesn't prevent Node from exiting
    if (this.flushTimer && typeof this.flushTimer === "object" && "unref" in this.flushTimer) {
      this.flushTimer.unref();
    }
  }

  /**
   * Buffer a log entry. Flushes automatically when buffer is full.
   *
   * @param entry - Log entry to buffer
   */
  public write(entry: ILogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.bufferSize) {
      this.drainBuffer();
    }
  }

  /**
   * Flush all buffered entries to the inner reporter and stop the timer.
   *
   * @returns Promise that resolves when all entries are written
   */
  public async flush(): Promise<void> {
    // Stop the interval timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Drain remaining entries
    this.drainBuffer();

    // Flush the inner reporter if it supports it
    if (this.inner.flush) {
      await this.inner.flush();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Write all buffered entries to the inner reporter and clear the buffer.
   */
  private drainBuffer(): void {
    if (this.buffer.length === 0) return;

    const entries = this.buffer;
    this.buffer = [];

    for (const entry of entries) {
      try {
        this.inner.write(entry);
      } catch {
        // Fail-open — don't lose remaining entries if one fails
      }
    }
  }
}
