/**
 * @file mock-devtools-panels-registry.ts
 * @module @stackra/devtools/testing
 * @description In-memory `IDevtoolsPanelsRegistry` implementation.
 *
 *   Used by both `@stackra/devtools`'s own unit tests and by
 *   downstream consumers that need to exercise a panel contribution
 *   without spinning up the full DI container.
 */

import type { DevtoolsCategory, IDevtoolsPanel, IDevtoolsPanelsRegistry } from '@stackra/contracts';

/** Fallback category when `panel.category` is omitted. */
const DEFAULT_PANEL_CATEGORY: DevtoolsCategory = 'modules';

/** Numeric weight for `panel.order` when omitted. */
const DEFAULT_PANEL_ORDER = 100;

/**
 * A predictable, in-memory `IDevtoolsPanelsRegistry` shipped by
 * `@stackra/devtools/testing`.
 *
 * The mock is drop-in equivalent to the production
 * `DevtoolsPanelsRegistry` — last-wins per id, stable snapshot
 * identity, subscribe fires exactly once per mutation — minus the
 * event-emitter fan-out (tests are self-contained).
 *
 * Wrap this class in `createAssertableProxy` via the companion
 * `createMockDevtoolsRegistry` factory when the test needs
 * `.$.wasCalledWith(...)` assertions.
 */
export class MockDevtoolsPanelsRegistry implements IDevtoolsPanelsRegistry {
  /** Panels keyed by their stable id. */
  private readonly panels = new Map<string, IDevtoolsPanel>();

  /** Change subscribers. */
  private readonly listeners = new Set<() => void>();

  /** Snapshot of the sorted panel list — rebuilt on mutation. */
  private snapshot: readonly IDevtoolsPanel[] = [];

  // ── IDevtoolsPanelsRegistry ──────────────────────────────────────

  /** @inheritdoc */
  public register(panel: IDevtoolsPanel): void {
    this.panels.set(panel.id, panel);
    this.rebuildSnapshot();
    this.notify();
  }

  /** @inheritdoc */
  public unregister(id: string): void {
    if (!this.panels.delete(id)) return;
    this.rebuildSnapshot();
    this.notify();
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
    return grouped;
  }

  /** @inheritdoc */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Test hooks ───────────────────────────────────────────────────

  /** Clear every panel + every subscriber — call between tests. */
  public reset(): void {
    this.panels.clear();
    this.listeners.clear();
    this.snapshot = [];
  }

  /** How many panels are currently registered. */
  public get size(): number {
    return this.panels.size;
  }

  // ── Private ──────────────────────────────────────────────────────

  private rebuildSnapshot(): void {
    const arr = Array.from(this.panels.values());
    arr.sort((a, b) => {
      const orderA = a.order ?? DEFAULT_PANEL_ORDER;
      const orderB = b.order ?? DEFAULT_PANEL_ORDER;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });
    this.snapshot = arr;
  }

  private notify(): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener();
      } catch {
        // fail-soft — matches the production registry.
      }
    }
  }
}
