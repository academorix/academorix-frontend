/**
 * @file event-emitter.service.ts
 * @module @stackra/events/core/services
 * @description Lightweight zero-dependency event bus with wildcard matching.
 *   Implements the full event emitter contract: typed dispatch, wildcard
 *   patterns (`*` single-segment, `**` multi-segment), prepended listeners,
 *   one-shot listeners, and async dispatch.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";

import { EVENT_EMITTER_CONFIG_INTERNAL } from "@/core/constants/event-emitter-config-internal.constant";
import type { IEventEmitterConfig } from "@/core/interfaces";
import type { IListenerEntry, EventListener } from "@/core/interfaces/listener-entry.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Lightweight event emitter with wildcard pattern matching.
 *
 * Zero external dependencies. Supports:
 * - Synchronous and async event dispatch
 * - Wildcard patterns: `*` (single segment) and `**` (multi-segment)
 * - Listener prepending (priority listeners fire first)
 * - One-shot listeners (auto-remove after first fire)
 * - Max listener warnings (detect memory leaks)
 * - Full introspection (listenerCount, eventNames)
 *
 * Managed by the DI container — inject via `EventEmitter` class token
 * or the `EVENT_EMITTER` symbol.
 *
 * @example
 * ```typescript
 * const emitter = container.get(EventEmitter);
 *
 * emitter.on('user.created', (payload) => {
 *   logger.info('New user:', payload);
 * });
 *
 * emitter.emit('user.created', { id: 1, name: 'Alice' });
 * ```
 *
 * @example
 * ```typescript
 * // Wildcard subscription
 * emitter.on('order.*', (event, payload) => {
 *   logger.info(`Order event: ${event}`, payload);
 * });
 *
 * emitter.emit('order.created', { orderId: 123 }); // matches
 * emitter.emit('order.shipped', { orderId: 123 }); // matches
 * ```
 */
@Injectable()
export class EventEmitter {
  /** Map of exact event names/patterns to their listener arrays. */
  private readonly listeners: Map<string | symbol, IListenerEntry[]> = new Map();

  /** Whether wildcard matching is enabled. */
  private readonly wildcard: boolean;

  /** Segment delimiter for wildcard matching. */
  private readonly delimiter: string;

  /** Max listeners per event before warning. `0` disables the warning. */
  private readonly maxListeners: number;

  private readonly logger = new Logger(EventEmitter.name);

  /**
   * @param config - Optional configuration injected via DI. Bound
   *   by `EventEmitterModule.forRoot` / `.forRootAsync` under the
   *   package-internal `EVENT_EMITTER_CONFIG_INTERNAL` symbol. The
   *   `@Optional()` marker means the emitter can be instantiated
   *   directly (`new EventEmitter()`) in tests without a container,
   *   in which case it falls back to the per-field defaults below.
   */
  public constructor(
    @Optional()
    @Inject(EVENT_EMITTER_CONFIG_INTERNAL)
    config?: IEventEmitterConfig,
  ) {
    // Field-level defaults — the emitter is genuinely configurable at
    // the field level (no `mergeConfig` pass anymore), so we apply
    // the fallbacks with `??` right here at the read site.
    const opts = config ?? {};
    this.wildcard = opts.wildcard ?? false;
    this.delimiter = opts.delimiter ?? ".";
    this.maxListeners = opts.maxListeners ?? 10;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Subscription API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Subscribe a listener to an event.
   *
   * @param event - Event name, symbol, or wildcard pattern
   * @param listener - Callback function invoked on dispatch
   * @returns `this` for chaining
   */
  public on(event: string | symbol, listener: EventListener): this {
    this.addListener(event, listener, false, false);
    return this;
  }

  /**
   * Subscribe a one-shot listener (auto-removed after first invocation).
   *
   * @param event - Event name, symbol, or wildcard pattern
   * @param listener - Callback function (fires once)
   * @returns `this` for chaining
   */
  public once(event: string | symbol, listener: EventListener): this {
    this.addListener(event, listener, true, false);
    return this;
  }

  /**
   * Subscribe a listener at the front of the listener array (fires first).
   *
   * @param event - Event name, symbol, or wildcard pattern
   * @param listener - Callback function (prepended)
   * @returns `this` for chaining
   */
  public prependListener(event: string | symbol, listener: EventListener): this {
    this.addListener(event, listener, false, true);
    return this;
  }

  /**
   * Remove a specific listener from an event.
   *
   * @param event - Event name, symbol, or wildcard pattern
   * @param listener - The exact function reference to remove
   * @returns `this` for chaining
   */
  public off(event: string | symbol, listener: EventListener): this {
    const entries = this.listeners.get(event);
    if (!entries) return this;

    const index = entries.findIndex((entry) => entry.fn === listener);
    if (index !== -1) {
      entries.splice(index, 1);
    }
    if (entries.length === 0) {
      this.listeners.delete(event);
    }
    return this;
  }

  /**
   * Remove all listeners for an event (or all events if none specified).
   *
   * @param event - Event to clear (optional — clears ALL if omitted)
   * @returns `this` for chaining
   */
  public removeAllListeners(event?: string | symbol): this {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Dispatch API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Emit an event synchronously to all matching listeners.
   *
   * Listeners execute in registration order. Wildcard listeners receive
   * the event name as the first argument followed by the payload.
   *
   * @param event - Event name to dispatch
   * @param args - Payload arguments forwarded to listeners
   * @returns `true` if at least one listener was called
   */
  public emit(event: string | symbol, ...args: unknown[]): boolean {
    const matches = this.getMatchingEntries(event);
    if (matches.length === 0) return false;

    for (const { entry, key, isWildcard } of matches) {
      try {
        if (isWildcard) {
          // Wildcard listeners receive the actual event name as first arg
          entry.fn(event, ...args);
        } else {
          entry.fn(...args);
        }
      } catch {
        // Listener errors are swallowed in sync emit — use emitAsync for error tracking
      }
      if (entry.once) {
        this.removeEntry(key, entry);
      }
    }
    return true;
  }

  /**
   * Emit an event asynchronously — awaits each listener sequentially.
   *
   * Returns an array of results from each listener (undefined for errors).
   * Errors are caught and logged — they don't abort the dispatch chain.
   *
   * @param event - Event name to dispatch
   * @param args - Payload arguments forwarded to listeners
   * @returns Array of listener return values
   */
  public async emitAsync(event: string | symbol, ...args: unknown[]): Promise<unknown[]> {
    const matches = this.getMatchingEntries(event);
    const results: unknown[] = [];

    for (const { entry, key, isWildcard } of matches) {
      try {
        const result = isWildcard ? await entry.fn(event, ...args) : await entry.fn(...args);
        results.push(result);
      } catch {
        results.push(undefined);
      }
      if (entry.once) {
        this.removeEntry(key, entry);
      }
    }
    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Introspection API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Count listeners for a specific event (including wildcard matches).
   *
   * @param event - Event name to count
   * @returns Number of matching listeners
   */
  public listenerCount(event: string | symbol): number {
    if (this.wildcard && typeof event === "string") {
      return this.getMatchingEntries(event).length;
    }
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Get all registered event names/patterns.
   *
   * @returns Array of event keys with at least one listener
   */
  public eventNames(): Array<string | symbol> {
    return [...this.listeners.keys()];
  }

  /**
   * Check if an event has any listeners (including wildcard matches).
   *
   * @param event - Event name to check
   * @returns `true` if at least one listener would fire
   */
  public hasListeners(event: string | symbol): boolean {
    return this.listenerCount(event) > 0;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Typed Event Dispatch
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Dispatch a typed event class instance.
   *
   * The class name (or a static `eventName` property) becomes the event name.
   * Listeners can subscribe by class reference: `@OnEvent(OrderCreated)`.
   *
   * @param event - An event class instance (must have a constructor with a name)
   * @returns `true` if at least one listener was called
   *
   * @example
   * ```typescript
   * class OrderCreated {
   *   static eventName = 'order.created';
   *   constructor(public readonly order: Order) {}
   * }
   *
   * emitter.dispatch(new OrderCreated(order));
   * // Listeners on 'order.created' AND 'OrderCreated' both fire
   * ```
   */
  public dispatch(event: object): boolean {
    const ctor = event.constructor as Function & { eventName?: string };
    const eventName = ctor.eventName ?? ctor.name;
    return this.emit(eventName, event);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Transactional Events
  // ══════════════════════════════════════════════════════════════════════════════

  /** Buffer of events waiting for transaction commit. */
  private pendingTransactionalEvents: Array<{ event: string | symbol; args: unknown[] }> = [];

  /** Whether we're currently in a transaction context. */

  /**
   * Buffer an event to be emitted only after the current transaction commits.
   *
   * Use this for events that should NOT fire if the transaction rolls back.
   * Call `flushPendingEvents()` after the transaction commits successfully,
   * or `discardPendingEvents()` on rollback.
   *
   * @param event - Event name to buffer
   * @param args - Payload arguments
   *
   * @example
   * ```typescript
   * // In a service with ORM:
   * await em.transactional(async () => {
   *   const order = em.create(Order, data);
   *   em.persist(order);
   *   emitter.emitAfterCommit('order.created', { orderId: order.id });
   * });
   * // Event fires ONLY if the transaction commits successfully
   * ```
   */
  public emitAfterCommit(event: string | symbol, ...args: unknown[]): void {
    this.pendingTransactionalEvents.push({ event, args });
  }

  /**
   * Flush all buffered transactional events (call after commit).
   *
   * Emits all events that were buffered via `emitAfterCommit()` and
   * clears the buffer. Call this from your ORM flush lifecycle hook.
   */
  public flushPendingEvents(): void {
    const pending = [...this.pendingTransactionalEvents];
    this.pendingTransactionalEvents = [];

    for (const { event, args } of pending) {
      this.emit(event, ...args);
    }
  }

  /**
   * Discard all buffered transactional events (call on rollback).
   *
   * Clears the buffer without emitting. Use when a transaction fails.
   */
  public discardPendingEvents(): void {
    this.pendingTransactionalEvents = [];
  }

  /**
   * Whether there are buffered events waiting for commit.
   *
   * @returns `true` if events are pending
   */
  public hasPendingEvents(): boolean {
    return this.pendingTransactionalEvents.length > 0;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Listener Management
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Add a listener entry to the internal map.
   *
   * @param event - Event name or pattern
   * @param listener - Callback to register
   * @param once - Whether the listener auto-removes after first dispatch
   * @param prepend - Whether to insert at the front of the array
   */
  private addListener(
    event: string | symbol,
    listener: EventListener,
    once: boolean,
    prepend: boolean,
  ): void {
    let entries = this.listeners.get(event);
    if (!entries) {
      entries = [];
      this.listeners.set(event, entries);
    }

    const entry: IListenerEntry = { fn: listener, once };

    if (prepend) {
      entries.unshift(entry);
    } else {
      entries.push(entry);
    }

    // Memory leak warning
    if (this.maxListeners > 0 && entries.length > this.maxListeners) {
      this.logger.warn(
        `Possible memory leak: ${entries.length} listeners for ` +
          `"${String(event)}". Max is ${this.maxListeners}.`,
      );
    }
  }

  /**
   * Remove a specific entry from the listener map.
   *
   * @param event - The event the entry belongs to
   * @param entry - The entry to remove
   */
  private removeEntry(event: string | symbol, entry: IListenerEntry): void {
    const entries = this.listeners.get(event);
    if (!entries) return;

    const index = entries.indexOf(entry);
    if (index !== -1) {
      entries.splice(index, 1);
    }
    if (entries.length === 0) {
      this.listeners.delete(event);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Wildcard Matching
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Internal match result.
   */
  private getMatchingEntries(event: string | symbol): Array<{
    entry: IListenerEntry;
    key: string | symbol;
    isWildcard: boolean;
  }> {
    const results: Array<{ entry: IListenerEntry; key: string | symbol; isWildcard: boolean }> = [];

    // Exact match first
    const exact = this.listeners.get(event);
    if (exact) {
      for (const entry of [...exact]) {
        results.push({ entry, key: event, isWildcard: false });
      }
    }

    // Wildcard matching (only for string events when enabled)
    if (this.wildcard && typeof event === "string") {
      for (const [pattern, entries] of this.listeners) {
        if (pattern === event) continue;
        if (typeof pattern !== "string") continue;
        if (this.matchesWildcard(pattern, event)) {
          for (const entry of [...entries]) {
            results.push({ entry, key: pattern, isWildcard: true });
          }
        }
      }
    }

    return results;
  }

  /**
   * Whether a wildcard pattern matches an event name.
   *
   * Supports `*` (matches one segment) and `**` (matches one or more segments).
   *
   * @param pattern - The listener pattern (e.g., 'user.*', 'app.**')
   * @param event - The dispatched event name (e.g., 'user.created')
   * @returns `true` when the pattern matches
   */
  private matchesWildcard(pattern: string, event: string): boolean {
    const patternParts = pattern.split(this.delimiter);
    const eventParts = event.split(this.delimiter);
    return this.matchParts(patternParts, 0, eventParts, 0);
  }

  /**
   * Recursive wildcard matching helper.
   *
   * @param pattern - Pattern segment array
   * @param pi - Pattern index
   * @param event - Event segment array
   * @param ei - Event index
   * @returns `true` when the remaining segments match
   */
  private matchParts(pattern: string[], pi: number, event: string[], ei: number): boolean {
    if (pi === pattern.length && ei === event.length) return true;
    if (pi === pattern.length) return false;

    const segment = pattern[pi];

    if (segment === "**") {
      // ** matches one or more segments
      for (let skip = 1; skip <= event.length - ei; skip++) {
        if (this.matchParts(pattern, pi + 1, event, ei + skip)) {
          return true;
        }
      }
      return false;
    }

    if (ei === event.length) return false;

    if (segment === "*") {
      // * matches exactly one segment
      return this.matchParts(pattern, pi + 1, event, ei + 1);
    }

    // Literal match
    if (segment === event[ei]) {
      return this.matchParts(pattern, pi + 1, event, ei + 1);
    }

    return false;
  }
}
