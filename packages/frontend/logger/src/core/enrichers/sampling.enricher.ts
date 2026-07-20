/**
 * @file sampling.enricher.ts
 * @module @stackra/logger/core/enrichers
 * @description Sampling enricher — probabilistically drops log entries
 *   based on configurable per-level rates. Used to reduce log volume
 *   in high-throughput environments without losing critical entries.
 */

import { LogLevel } from "@stackra/contracts";
import type { ILogEntry } from "@stackra/contracts";
import type { ILogEnricher } from "@stackra/contracts";

/** Per-level sampling rates (0 = drop all, 1 = keep all, 0.5 = keep 50%). */
export type SamplingConfig = Partial<Record<LogLevel | string, number>>;

/**
 * Sampling enricher — drops entries based on configured rates per level.
 *
 * This enricher MUST be prepended to the pipeline (runs first) so that
 * dropped entries don't waste enrichment processing.
 *
 * ERROR and FATAL entries always pass through regardless of configuration
 * to ensure critical issues are never lost.
 *
 * @example
 * ```typescript
 * const sampling = new SamplingEnricher({
 *   debug: 10,  // keep 1 in 10 debug entries
 *   info: 5,    // keep 1 in 5 info entries
 *   warn: 1,    // keep all warnings
 * });
 *
 * manager.prependEnricher(sampling);
 * ```
 */
export class SamplingEnricher implements ILogEnricher {
  /** Per-level counters for determining which entries pass. */
  private readonly counters = new Map<string, number>();

  /**
   * @param config - Sampling rates per level
   */
  public constructor(private readonly config: SamplingConfig) {}

  /**
   * Evaluate whether an entry should pass through or be dropped.
   *
   * @param entry - The log entry to evaluate
   * @returns The entry if it passes sampling, or null to drop it
   */
  public enrich(entry: ILogEntry): ILogEntry | null {
    // ERROR and FATAL are NEVER sampled — always pass through
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      return entry;
    }

    const rate = this.config[entry.level];

    // No sampling configured for this level — pass through
    if (rate === undefined || rate === 1) {
      return entry;
    }

    // Rate of 0 means drop all at this level
    if (rate === 0) {
      return null;
    }

    // Increment counter and check if this entry passes
    const current = (this.counters.get(entry.level) ?? 0) + 1;
    this.counters.set(entry.level, current);

    if (current >= rate) {
      this.counters.set(entry.level, 0);
      return entry;
    }

    return null;
  }
}
