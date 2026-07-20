/**
 * @file context.registry.ts
 * @module @stackra/ai/core/registries
 * @description Runtime registry of UI context frames contributed via
 *   `useAiContextFrame`. Holds frames in a focus stack ordered by
 *   `(priority desc, seq desc)` so the same-priority frame that mounted
 *   later is topmost.
 *
 *   Ordering rule (Req 11.2, 11.3):
 *
 *     ─── higher priority ────────────── lower priority ───
 *     later seq → topmost                first seq → bottommost
 *
 *   The registry does not perform serialization, redaction, size
 *   enforcement, or debouncing — those are the {@link ContextCollector}'s
 *   job. It stores frames and emits change notifications when they mutate.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  AI_EVENTS,
  EVENT_EMITTER,
  type IAiContextFrame,
  type IEventEmitter,
} from "@stackra/contracts";

/** Payload accepted by {@link ContextRegistry.register}. */
export interface IContextRegistration {
  /** Frame key. */
  key: string;
  /** Snapshot payload (PII-redacted at collection time). */
  snapshot: unknown;
  /** Ordering weight (default 0). */
  priority?: number;
  /** Namespacing scope for multiple instances of the same key. */
  scope?: string;
}

/**
 * ContextRegistry — Requirement 10 + Requirement 11.
 */
@Injectable()
export class ContextRegistry {
  private readonly logger = new Logger(ContextRegistry.name);

  /** Backing store keyed by `{scope}::{key}`. */
  private readonly items = new Map<string, IAiContextFrame>();

  /** Monotonic mount-order counter used to break priority ties. */
  private nextSeq = 0;

  /** Change subscribers. */
  private readonly listeners = new Set<() => void>();

  public constructor(@Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter) {}

  // ────────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────────

  /**
   * Register a new context frame. Assigns a fresh `seq` so ties break
   * on mount order.
   *
   * @param registration - Key, snapshot, priority, scope.
   */
  public register(registration: IContextRegistration): void {
    const { key, snapshot, priority = 0, scope } = registration;
    const storeKey = this.keyOf(key, scope);
    const frame: IAiContextFrame = {
      key,
      snapshot,
      priority,
      seq: this.nextSeq++,
      ...(scope !== undefined ? { scope } : {}),
    };
    this.items.set(storeKey, frame);
    this.notify();
  }

  /**
   * Update the snapshot of an already-registered frame. Keeps `seq` so
   * the frame stays in its stack position across updates.
   *
   * No-ops when the frame is not registered (nothing to update).
   *
   * @param key - Frame key.
   * @param snapshot - New snapshot value.
   * @param scope - Optional scope.
   */
  public update(key: string, snapshot: unknown, scope?: string): void {
    const storeKey = this.keyOf(key, scope);
    const existing = this.items.get(storeKey);
    if (!existing) return;
    this.items.set(storeKey, { ...existing, snapshot });
    this.notify();
  }

  /**
   * Remove a frame.
   *
   * @param key - Frame key.
   * @param scope - Optional scope.
   */
  public unregister(key: string, scope?: string): void {
    const storeKey = this.keyOf(key, scope);
    if (!this.items.has(storeKey)) return;
    this.items.delete(storeKey);
    this.notify();
  }

  /** Whether a frame is currently registered under `(key, scope)`. */
  public has(key: string, scope?: string): boolean {
    return this.items.has(this.keyOf(key, scope));
  }

  /** Fetch a frame by exact `(key, scope)` — mostly for tests/diagnostics. */
  public get(key: string, scope?: string): IAiContextFrame | undefined {
    return this.items.get(this.keyOf(key, scope));
  }

  /** Snapshot of every registered frame, in insertion order. */
  public all(): IAiContextFrame[] {
    return Array.from(this.items.values());
  }

  /** Number of live frames. */
  public count(): number {
    return this.items.size;
  }

  /**
   * The ordered focus stack — topmost first.
   *
   * Sorted by `priority` desc, then `seq` desc (so later-mounted frames
   * at the same priority sit above earlier-mounted ones). This is the
   * ordering that {@link ContextCollector} serializes into the snapshot.
   *
   * Guaranteed to be a permutation of {@link all} — no drops, no duplicates
   * (Property 6).
   */
  public orderedStack(): IAiContextFrame[] {
    return this.all().sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.seq - a.seq;
    });
  }

  /**
   * Subscribe to registry changes. Fires after any `register`/`update`/
   * `unregister`.
   *
   * @param listener - Callback invoked with no arguments.
   * @returns Unsubscribe function.
   */
  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  private keyOf(key: string, scope?: string): string {
    return scope ? `${scope}::${key}` : key;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        this.logger.warn("[ContextRegistry] change listener threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    // Broadcast the same signal on the shared event bus for observers
    // outside the registry's direct subscriber list — dashboards,
    // telemetry, and cross-package coordinators can watch context
    // churn without holding an `onChange` subscription.
    void this.events?.emit(AI_EVENTS.CONTEXT_CHANGED, { count: this.items.size });
  }
}
