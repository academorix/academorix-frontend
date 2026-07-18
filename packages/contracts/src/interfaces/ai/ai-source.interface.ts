/**
 * @file ai-source.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description A citation/source attached to an assistant message.
 */

/** A citation surfaced with an assistant message. */
export interface IAiSource {
  /** Stable identifier for the source. */
  id: string;
  /** Display title. */
  title: string;
  /** Link to the source, when available. */
  url?: string;
  /** Short excerpt/snippet. */
  snippet?: string;
}
