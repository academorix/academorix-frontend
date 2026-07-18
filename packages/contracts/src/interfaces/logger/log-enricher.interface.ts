/**
 * @file log-enricher.interface.ts
 * @module @stackra/contracts/interfaces/logger
 * @description Enricher contract — adds metadata to log entries before dispatch.
 */

import type { ILogEntry } from "./log-entry.interface";

/** Enricher — adds metadata to log entries before dispatch. */
export interface ILogEnricher {
  /**
   * Enrich a log entry with additional context/metadata.
   *
   * Returning `null` drops the entry from the pipeline (used by
   * sampling / rate-limiting enrichers).
   */
  enrich(entry: ILogEntry): ILogEntry | null;
}
