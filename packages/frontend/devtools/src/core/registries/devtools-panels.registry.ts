/**
 * @file devtools-panels.registry.ts
 * @module @stackra/devtools/core/registries
 * @description Cross-package registry that holds every registered
 *   `IDevtoolsPanel` and notifies subscribers on change.
 *
 *   Implements `IDevtoolsPanelsRegistry`. Registration is
 *   **last-wins per `panel.id`** — safe for the combination of
 *   discovery-scan + `forFeature` seed-loader, since whichever path
 *   arrives second is a no-op after the first has run.
 *
 *   The registry emits `DEVTOOLS_EVENTS.PANEL_REGISTERED` /
 *   `PANEL_UNREGISTERED` through the optional `EVENT_EMITTER`
 *   (fail-soft when the emitter isn't bound — devtools must never
 *   fail an app because event fan-out is unavailable).
 */

import { Inject, Injectable, Optional, type OnModuleDestroy } from "@stackra/container";
import {
  DEVTOOLS_EVENTS,
  EVENT_EMITTER,
  type DevtoolsCategory,
  type IDevtoolsPanel,
  type IDevtoolsPanelsRegistry,
  type IEventEmitter,
} from "@stackra/contracts";

/** Numeric weight for `panel.order` when omitted — mirrors the workspace default. */
const DEFAULT_PANEL_ORDER = 100;

/** Fallback category when `panel.category` is omitted. */
const DEFAULT_PANEL_CATEGORY: DevtoolsCategory = "modules";

/**
 * The container-scoped devtools panels registry.
 *
 * The class is a plain `@Injectable()` — `DevtoolsModule.forRoot`
 * binds it to the `DEVTOOLS_REGISTRY` token via a `useExisting`
 * alias so the token is available to every consumer.
 */
@Injectable()
export class DevtoolsPanelsRegistry implements IDevtoolsPanelsRegistry, OnModuleDestroy {
  /** Panels keyed by their stable id. Last-wins per id. */
  private readonly panels = new Map<string, IDevtoolsPanel>();

  /** Change subscribers. */
  private readonly listeners = new Set<() => void>();

  /**
   * Snapshot of `list()` — cached until the registry mutates so
   * `useSyncExternalStore` reads a stable reference and doesn't
   * loop.
   */
  private snapshot: readonly IDevtoolsPanel[] = [];

  /**
   * @param emitter - Optional event bus. When absent, the registry
   *   still functions — just without cross-package fan-out.
   */
  public constructor(@Optional() @Inject(EVENT_EMITTER) private readonly emitter?: IEventEmitter) {}

  // ── Public API ───────────────────────────────────────────────────

  /** @inheritdoc */
  public register(panel: IDevtoolsPanel): void {
    // Last-wins per id — a re-register with the same id replaces
    // the earlier entry silently. Two independent contribution
    // paths (discovery scan + `forFeature` seed loader) can safely
    // reach this method with the same panel; the second call is a
    // no-op observationally.
    this.panels.set(panel.id, panel);
    this.rebuildSnapshot();
    this.notify();
    this.emit(DEVTOOLS_EVENTS.PANEL_REGISTERED, { id: panel.id });
  }

  /** @inheritdoc */
  public unregister(id: string): void {
    if (!this.panels.delete(id)) return;
    this.rebuildSnapshot();
    this.notify();
    this.emit(DEVTOOLS_EVENTS.PANEL_UNREGISTERED, { id });
  }

  /** @inheritdoc */
  public list(): readonly IDevtoolsPanel[] {
    return this.snapshot;
  }

  /** @inheritdoc */
  public find(id: string): IDevtoolsPanel | null {
    return this.panels.get(id) ?? null;
  }

  /** @inheritdoc */
  public byCategory(): ReadonlyMap<DevtoolsCategory, readonly IDevtoolsPanel[]> {
    const grouped = new Map<DevtoolsCategory, IDevtoolsPanel[]>();
    for (const panel of this.snapshot) {
      const category = panel.category ?? DEFAULT_PANEL_CATEGORY;
      const bucket = grouped.get(category);
      if (bucket) {
        bucket.push(panel);
      } else {
        grouped.set(category, [panel]);
      }
    }
    // Freeze each bucket into a `readonly IDevtoolsPanel[]` view so
    // the return type matches the interface contract.
    const frozen = new Map<DevtoolsCategory, readonly IDevtoolsPanel[]>();
    for (const [category, panels] of grouped) {
      frozen.set(category, panels.slice());
    }
    return frozen;
  }

  /** @inheritdoc */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  /**
   * Clear every subscriber on module destroy so we don't hold onto
   * closures across a test's teardown.
   */
  public onModuleDestroy(): void {
    this.listeners.clear();
    this.panels.clear();
    this.snapshot = [];
  }

  // ── Private ──────────────────────────────────────────────────────

  /**
   * Rebuild the stable snapshot — recomputed only when the registry
   * mutates so subscribers reading the array by reference see a
   * new identity exactly once per change.
   */
  private rebuildSnapshot(): void {
    const arr = Array.from(this.panels.values());
    arr.sort((a, b) => {
      // Sort by (category rank, panel.order, panel.id) — category
      // rank is applied downstream by `byCategory()`; here we just
      // stabilise the flat list on order + id.
      const orderA = a.order ?? DEFAULT_PANEL_ORDER;
      const orderB = b.order ?? DEFAULT_PANEL_ORDER;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });
    this.snapshot = arr;
  }

  /**
   * Fire every subscriber. Individual listener errors are swallowed
   * so a broken subscriber cannot stall the fan-out.
   */
  private notify(): void {
    // Snapshot before iterating so a listener that (un)subscribes
    // in response doesn't mutate the set we're iterating.
    for (const listener of Array.from(this.listeners)) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not affect the others.
      }
    }
  }

  /**
   * Emit a devtools event through the optional event bus.
   *
   * `IEventEmitter.emit` returns a `Promise<void>` — we intentionally
   * fire-and-forget and swallow a synchronous throw + a subsequent
   * rejection so a slow / broken emitter never blocks registration.
   */
  private emit(name: string, payload: Record<string, unknown>): void {
    if (!this.emitter) return;
    try {
      const p = this.emitter.emit(name, payload);
      // Attach a rejection handler so an async listener throwing
      // doesn't become an unhandled-promise-rejection log-spam.
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => {
          // fail-soft — see docblock.
        });
      }
    } catch {
      // fail-soft — emitter errors must not affect registration.
    }
  }
}
