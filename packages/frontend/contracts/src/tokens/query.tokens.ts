/**
 * @file query.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/query` layer.
 *
 *   The realtime transport is provided by `@stackra/realtime` — inject
 *   `REALTIME_MANAGER` directly for `liveMode` subscriptions and
 *   `channel.whisper(...)` broadcasts. No separate `LIVE_PROVIDER`
 *   abstraction is needed.
 *
 *   `QUERY_CONFIG` used to live here. It was moved to
 *   `@stackra/query` (internal token) — only `QueryModule.forRoot`
 *   binds it, only query hooks read it, no cross-package consumer
 *   should reach for it. See the DI reviewer report P1-2 finding.
 */

/** Token for the {@link IQueryClient} — owns fetcher registration + invalidation. */
export const QUERY_CLIENT = Symbol.for("QUERY_CLIENT");

/**
 * Token for the {@link IUndoableQueue} — the queue that tracks
 * in-flight `mutationMode: 'undoable'` mutations.
 *
 * @remarks Bound by `QueryModule.forRoot`. Toast UI packages
 *   subscribe to it to render the undo affordance.
 */
export const UNDOABLE_QUEUE = Symbol.for("UNDOABLE_QUEUE");
