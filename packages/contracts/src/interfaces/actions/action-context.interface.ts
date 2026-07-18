/**
 * @file action-context.interface.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Runtime context threaded through every action dispatch.
 */

/**
 * Runtime environment threaded through every action dispatch.
 *
 * The dispatcher merges caller-supplied context with defaults (like a
 * router-aware `navigate` callback) before invoking the handler.
 */
export interface IActionContext {
  /** The current record (e.g. the row that was clicked in a table). */
  record?: unknown;

  /** Selected row ids for bulk actions. */
  selectedIds?: ReadonlyArray<string | number>;

  /** Free-form metadata attached by the caller. */
  metadata?: Record<string, unknown>;

  /** Ambient scope (tenant / venue / …). */
  scope?: unknown;

  /** Caller-supplied navigator (typically wired by the React hook). */
  navigate?(to: string, options?: { replace?: boolean; state?: unknown }): void;

  /** Caller-supplied refresh callback. */
  refresh?(): void;

  /** Cancellation signal — honored by every async handler. */
  signal?: AbortSignal;
}
