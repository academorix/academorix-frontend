/**
 * @file ai-context-manager.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description High-level AI context-manager contract — a
 *   listener-friendly facade over `@stackra/ai`'s `ContextRegistry` that
 *   accepts "frames" (named payloads) so cross-package feeders (auth,
 *   scope, i18n) can push identity / locale / page context into the AI
 *   assistant without knowing the underlying registry API.
 *
 *   The token {@link AI_CONTEXT_MANAGER} is optionally provided —
 *   listeners inject it via `@Optional() @Inject(AI_CONTEXT_MANAGER)`
 *   so auth-side feeders no-op when `@stackra/ai` isn't in the graph.
 */

/**
 * A named, low-cardinality piece of context contributed by a feeder.
 *
 * `key` is a stable name for a slot (`user`, `page`, `locale`, `route`).
 * `snapshot` is the serialisable payload the AI runtime reads.
 */
export interface IAiContextFrameContribution {
  /** Payload for this frame (JSON-serialisable — the AI package handles redaction). */
  readonly [property: string]: unknown;
}

/**
 * High-level context-manager facade.
 *
 * Implementations wrap `@stackra/ai`'s `ContextRegistry` and translate
 * `setFrame` / `clearFrame` / `clearAll` into the registry's
 * `register` / `unregister` / `all()` API.
 */
export interface IAiContextManager {
  /**
   * Register or replace a named context frame.
   *
   * @param key      - Stable slot name (`user`, `page`, `locale`, ...).
   * @param payload  - Serialisable snapshot for the AI assistant.
   * @param scope    - Optional namespacing scope for multiple instances.
   */
  setFrame(key: string, payload: IAiContextFrameContribution, scope?: string): void;

  /**
   * Remove a specific frame (no-op when not registered).
   *
   * @param key   - The frame key to clear.
   * @param scope - Optional scope of the frame.
   */
  clearFrame(key: string, scope?: string): void;

  /** Clear every frame currently contributed. */
  clearAll(): void;
}
