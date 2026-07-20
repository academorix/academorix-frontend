/**
 * @file devtools-inspector.registry.ts
 * @module @stackra/devtools/core/registries
 * @description Cross-package registry that holds every registered
 *   `IDevtoolsInspectorRegionSource` and notifies subscribers on
 *   change.
 *
 *   Mirrors the shape of `DevtoolsPanelsRegistry` — same
 *   last-wins-per-id semantics, same fail-soft event fan-out via
 *   the optional `EVENT_EMITTER`. `collectAll()` fans out to every
 *   source and flattens the results.
 *
 *   Snapshot stability: `collectAll()` caches its flattened result
 *   in a `readonly IDevtoolsInspectorRegion[] | null` field. The
 *   cache is invalidated on `register` / `unregister` (source list
 *   changed) and can be manually refreshed via `refresh()` — the
 *   inspector overlay toolbar calls that from its "Refresh
 *   regions" button after the user resized / scrolled the page.
 *   This keeps `useSyncExternalStore` from tearing on repeated
 *   reads within the same snapshot window.
 */

import { Inject, Injectable, Optional, type OnModuleDestroy } from "@stackra/container";
import {
  EVENT_EMITTER,
  type IDevtoolsInspectorRegion,
  type IDevtoolsInspectorRegionSource,
  type IDevtoolsInspectorRegistry,
  type IEventEmitter,
} from "@stackra/contracts";

/**
 * The container-scoped inspector registry.
 */
@Injectable()
export class DevtoolsInspectorRegistry implements IDevtoolsInspectorRegistry, OnModuleDestroy {
  /** Sources keyed by their stable id. Last-wins per id. */
  private readonly registered = new Map<string, IDevtoolsInspectorRegionSource>();

  /** Change subscribers. */
  private readonly listeners = new Set<() => void>();

  /** Cached snapshot of the source list — see registry.rebuildSnapshot. */
  private snapshot: readonly IDevtoolsInspectorRegionSource[] = [];

  /**
   * Cached flattened regions across every source. `null` marks the
   * cache as invalid — the next `collectAll()` call re-collects and
   * repopulates it. Kept in sync via
   * {@link DevtoolsInspectorRegistry.invalidateRegions}.
   */
  private cachedRegions: readonly IDevtoolsInspectorRegion[] | null = null;

  public constructor(@Optional() @Inject(EVENT_EMITTER) private readonly emitter?: IEventEmitter) {}

  // ── Public API ───────────────────────────────────────────────────

  /** @inheritdoc */
  public register(source: IDevtoolsInspectorRegionSource): void {
    this.registered.set(source.id, source);
    this.rebuildSnapshot();
    // Any registration change invalidates the collected regions;
    // the next `collectAll()` will re-scan every source.
    this.invalidateRegions();
    this.notify();
  }

  /** @inheritdoc */
  public unregister(sourceId: string): void {
    if (!this.registered.delete(sourceId)) return;
    this.rebuildSnapshot();
    this.invalidateRegions();
    this.notify();
  }

  /** @inheritdoc */
  public sources(): readonly IDevtoolsInspectorRegionSource[] {
    return this.snapshot;
  }

  /**
   * Fan-out `collect()` and flatten the results.
   *
   * Returns a stable snapshot: repeated calls with no intervening
   * `register` / `unregister` / `refresh` return the SAME array
   * reference. This is the contract `useSyncExternalStore` requires
   * to avoid tearing under concurrent React.
   *
   * @returns Every region across every registered source, ordered by
   *   source id then by the region order returned from `collect()`.
   */
  public collectAll(): readonly IDevtoolsInspectorRegion[] {
    // Serve the cached snapshot when valid — this is the hot path
    // (called from `useSyncExternalStore` on every commit) and MUST
    // return the same reference until the cache is invalidated.
    if (this.cachedRegions !== null) {
      return this.cachedRegions;
    }
    const regions: IDevtoolsInspectorRegion[] = [];
    // Iterate the cached source snapshot so a source that unregisters
    // itself during `collect()` doesn't disturb the walk.
    for (const source of this.snapshot) {
      try {
        // Each source returns its own regions independently — one
        // broken source must not knock the whole overlay out.
        const chunk = source.collect();
        for (const region of chunk) regions.push(region);
      } catch {
        // fail-soft — see docblock.
      }
    }
    this.cachedRegions = regions;
    return this.cachedRegions;
  }

  /**
   * Invalidate the cached regions AND return a fresh snapshot in one
   * call. Wired to the inspector overlay's "Refresh regions" button.
   *
   * @returns The freshly-collected regions.
   */
  public refresh(): readonly IDevtoolsInspectorRegion[] {
    // Drop the cache first so `collectAll()` re-scans every source.
    this.invalidateRegions();
    // Notify subscribers so `useSyncExternalStore` picks the new
    // reference up on its next scheduled read.
    this.notify();
    return this.collectAll();
  }

  /** @inheritdoc */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  /** Clear every subscriber on module destroy. */
  public onModuleDestroy(): void {
    this.listeners.clear();
    this.registered.clear();
    this.snapshot = [];
    this.cachedRegions = null;
  }

  // ── Private ──────────────────────────────────────────────────────

  private rebuildSnapshot(): void {
    // Stable order by id — the overlay renders regions in the order
    // returned by `collect()` per source, but the sources
    // themselves have no natural ordering.
    const arr = Array.from(this.registered.values()).sort((a, b) => a.id.localeCompare(b.id));
    this.snapshot = arr;
  }

  /**
   * Drop the cached region snapshot so the next `collectAll()` call
   * re-scans every source. Called on every registry mutation and
   * from `refresh()`.
   */
  private invalidateRegions(): void {
    this.cachedRegions = null;
  }

  private notify(): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not affect the others.
      }
    }
    // Emitter fan-out is currently reserved for a future
    // `INSPECTOR_SOURCE_REGISTERED` event; keep the reference alive
    // so the DI graph resolves cleanly.
    void this.emitter;
  }
}
