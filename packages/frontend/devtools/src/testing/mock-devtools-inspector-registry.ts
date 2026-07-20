/**
 * @file mock-devtools-inspector-registry.ts
 * @module @stackra/devtools/testing
 * @description In-memory `IDevtoolsInspectorRegistry` implementation.
 */

import type {
  IDevtoolsInspectorRegion,
  IDevtoolsInspectorRegionSource,
  IDevtoolsInspectorRegistry,
} from "@stackra/contracts";

/**
 * A predictable, in-memory `IDevtoolsInspectorRegistry` shipped by
 * `@stackra/devtools/testing`.
 */
export class MockDevtoolsInspectorRegistry implements IDevtoolsInspectorRegistry {
  /** Sources keyed by their stable id. */
  private readonly registered = new Map<string, IDevtoolsInspectorRegionSource>();

  /** Change subscribers. */
  private readonly listeners = new Set<() => void>();

  /** Cached source list. */
  private snapshot: readonly IDevtoolsInspectorRegionSource[] = [];

  /** @inheritdoc */
  public register(source: IDevtoolsInspectorRegionSource): void {
    this.registered.set(source.id, source);
    this.rebuildSnapshot();
    this.notify();
  }

  /** @inheritdoc */
  public unregister(sourceId: string): void {
    if (!this.registered.delete(sourceId)) return;
    this.rebuildSnapshot();
    this.notify();
  }

  /** @inheritdoc */
  public sources(): readonly IDevtoolsInspectorRegionSource[] {
    return this.snapshot;
  }

  /** @inheritdoc */
  public collectAll(): readonly IDevtoolsInspectorRegion[] {
    const regions: IDevtoolsInspectorRegion[] = [];
    for (const source of this.snapshot) {
      try {
        const chunk = source.collect();
        for (const region of chunk) regions.push(region);
      } catch {
        // fail-soft — matches the production registry.
      }
    }
    return regions;
  }

  /** @inheritdoc */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Test hook — clear every source and every subscriber. */
  public reset(): void {
    this.registered.clear();
    this.listeners.clear();
    this.snapshot = [];
  }

  private rebuildSnapshot(): void {
    this.snapshot = Array.from(this.registered.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  private notify(): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener();
      } catch {
        // fail-soft
      }
    }
  }
}
