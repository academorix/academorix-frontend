/**
 * @file context.enricher.ts
 * @module @stackra/logger/core/enrichers
 * @description Enricher that reads from the ContextRepository and injects
 *   all stored context data into every log entry's meta field.
 */

import type { ILogEnricher, ILogEntry } from "@stackra/contracts";
import { ContextRepository } from "@/core/services/context-repository.service";

/**
 * Context enricher — injects ContextRepository data into log entries.
 *
 * Reads all visible context from the ContextRepository and merges it
 * into the entry's meta. Repository context has lower priority than
 * entry-level meta (explicit meta on a log call wins).
 *
 * @example
 * ```typescript
 * const repo = new ContextRepository();
 * repo.add('ownerId', 'abc');
 * const enricher = new ContextEnricher(repo);
 * // Every entry enriched will have {ownerId: 'abc' } in meta
 * ```
 */
export class ContextEnricher implements ILogEnricher {
  /** Enricher identifier. */
  public readonly name = "context";

  /**
   * @param repository - ContextRepository instance to read from
   */
  public constructor(private readonly repository: ContextRepository) {}

  /**
   * Enrich a log entry with context repository data.
   * Repository context is lowest priority — entry meta overrides it.
   *
   * @param entry - Log entry to enrich
   * @returns Enriched entry with repository context merged into meta
   */
  public enrich(entry: ILogEntry): ILogEntry | null {
    const repoContext = this.repository.all();

    // Skip if repository is empty
    if (Object.keys(repoContext).length === 0) {
      return entry;
    }

    return {
      ...entry,
      meta: { ...repoContext, ...(entry.meta ?? {}) },
    };
  }
}
