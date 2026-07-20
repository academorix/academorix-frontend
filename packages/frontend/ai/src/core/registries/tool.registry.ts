/**
 * @file tool.registry.ts
 * @module @stackra/ai/core/registries
 * @description Runtime registry of hook-authored client tools.
 *
 *   The registry holds `IToolEntry` values keyed by `{scope}::{name}` and
 *   supports:
 *
 *   - **Ref-counted registration** (Req 6.10) — two mounted hosts under
 *     the same `(scope, name)` share a `refCount`, and a `unregister` only
 *     removes the entry when the count reaches zero.
 *   - **Last-registered-wins** for the handler/definition on collision
 *     with a diagnostic warning (Req 6.9).
 *   - **Scope keying** so scope-distinct registrations coexist (Req 6.11).
 *   - **Change notification** via a listener list and, when available, an
 *     `AI_EVENTS.TOOLSET_CHANGED` emission on the shared event bus.
 *
 *   Lookup by `toolName` (invoked by the `ToolExecutor` when a tool-call
 *   event arrives) walks the entries and returns the last-inserted match,
 *   so scope-namespaced entries with the same name still route to a
 *   deterministic handler.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  AI_EVENTS,
  EVENT_EMITTER,
  type IAiClientToolDefinition,
  type IEventEmitter,
} from "@stackra/contracts";

/** Handler signature invoked by `ToolExecutor` on a matched tool call. */
export type ToolHandler = (
  args: unknown,
  ctx: { signal: AbortSignal },
) => Promise<unknown> | unknown;

/** Ref-counted entry stored by the {@link ToolRegistry}. */
export interface IToolEntry {
  /** Tool name (matches the definition name, hoisted for quick access). */
  name: string;
  /** Full client-tool definition (description, schema, priority, scope, …). */
  definition: IAiClientToolDefinition;
  /** Executable handler for the tool. */
  handler: ToolHandler;
  /** How many mounted hosts currently claim this `(scope, name)` slot. */
  refCount: number;
}

/** Registration payload accepted by {@link ToolRegistry.register}. */
export interface IToolRegistration {
  /** Full client-tool definition. */
  definition: IAiClientToolDefinition;
  /** Handler for the tool. */
  handler: ToolHandler;
}

/**
 * The client-tool registry — Requirement 6.
 */
@Injectable()
export class ToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name);

  /** Backing store keyed by `{scope}::{name}`. */
  private readonly items = new Map<string, IToolEntry>();

  /** Change subscribers. */
  private readonly listeners = new Set<() => void>();

  public constructor(@Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter) {}

  // ────────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────────

  /**
   * Register (or increment the ref-count for) a client tool.
   *
   * @param registration - Definition + handler.
   */
  public register(registration: IToolRegistration): void {
    const { definition, handler } = registration;
    const key = this.keyOf(definition.name, definition.scope);
    const existing = this.items.get(key);

    if (existing) {
      // Same key already present — last-registered-wins for handler +
      // definition, ref-count increments so unmounts stay balanced.
      this.logger.warn(
        `[ToolRegistry] duplicate client-tool registration for "${key}" — last-registered wins`,
      );
      this.items.set(key, {
        name: definition.name,
        definition,
        handler,
        refCount: existing.refCount + 1,
      });
    } else {
      this.items.set(key, {
        name: definition.name,
        definition,
        handler,
        refCount: 1,
      });
    }

    this.notify();
  }

  /**
   * Decrement the ref-count for a tool and remove it when zero.
   *
   * @param name - Tool name.
   * @param scope - Optional scope namespace.
   */
  public unregister(name: string, scope?: string): void {
    const key = this.keyOf(name, scope);
    const existing = this.items.get(key);
    if (!existing) return;

    if (existing.refCount <= 1) {
      this.items.delete(key);
    } else {
      this.items.set(key, { ...existing, refCount: existing.refCount - 1 });
    }
    this.notify();
  }

  /**
   * Look up the entry backing a decoded tool-call name.
   *
   * When multiple scoped entries share a `name`, the most recently
   * inserted one wins (JS Map preserves insertion order).
   *
   * @param toolName - The name as it arrives on the wire.
   * @returns The matching entry, or `undefined` for a server tool.
   */
  public findByName(toolName: string): IToolEntry | undefined {
    let match: IToolEntry | undefined;
    for (const entry of this.items.values()) {
      if (entry.name === toolName) match = entry;
    }
    return match;
  }

  /** Whether any registration currently backs the given `toolName`. */
  public hasName(toolName: string): boolean {
    return this.findByName(toolName) !== undefined;
  }

  /**
   * Fetch the entry for an exact `(name, scope)` key.
   *
   * Prefer {@link findByName} for wire-driven lookups — this method is
   * mainly used by tests and diagnostics that need to peek at a specific
   * registration.
   */
  public get(name: string, scope?: string): IToolEntry | undefined {
    return this.items.get(this.keyOf(name, scope));
  }

  /** Snapshot of every entry, in insertion order. */
  public all(): IToolEntry[] {
    return Array.from(this.items.values());
  }

  /** Number of live registrations. */
  public count(): number {
    return this.items.size;
  }

  /**
   * Subscribe to registry changes. Fires after `register`/`unregister`.
   *
   * @param listener - Callback invoked with no args.
   * @returns Unsubscribe function.
   */
  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  /** Compose the storage key from name + optional scope. */
  private keyOf(name: string, scope?: string): string {
    return scope ? `${scope}::${name}` : name;
  }

  /** Fire listeners + emit the shared `TOOLSET_CHANGED` event. */
  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        this.logger.warn("[ToolRegistry] change listener threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    void this.events?.emit(AI_EVENTS.TOOLSET_CHANGED, { count: this.items.size });
  }
}
