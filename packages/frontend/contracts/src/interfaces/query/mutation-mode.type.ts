/**
 * @file mutation-mode.type.ts
 * @module @stackra/contracts/interfaces/query
 * @description The three mutation execution modes exposed by
 *   `useMutation` and set as a default on `QueryModule.forRoot`.
 *
 *   The values are borrowed verbatim from Refine's data-provider
 *   vocabulary so anyone who's worked with Refine reads them without
 *   translation.
 */

/**
 * How `useMutation` applies a server write against the local cache.
 *
 * - **`pessimistic`** — Wait for the server response before updating
 *   the local store. Traditional loading-state UX. Safest for
 *   destructive writes.
 * - **`optimistic`** — Update the local store immediately with the
 *   expected outcome; roll it back if the server call throws. Best
 *   UX for high-latency links.
 * - **`undoable`** — Update the local store immediately, queue the
 *   mutation with a countdown, and let the user cancel via a toast
 *   before it hits the server. Gmail's "Undo send" pattern.
 */
export type MutationMode = "pessimistic" | "optimistic" | "undoable";
