/**
 * @file devtools-inspector.interface.ts
 * @module @stackra/contracts/interfaces/devtools
 * @description Devtools inspector overlay contracts + composite family
 *   (`IDevtoolsInspectorRegion`, `IDevtoolsInspectorRegionSource`,
 *   `IDevtoolsInspectorRegistry`).
 *
 *   The inspector renders a translucent overlay with a labelled outline
 *   for every region enumerated by every registered source. Sources are
 *   contributed by feature packages
 *   (`@stackra/scope` reports one region per active scope, `@stackra/ssr`
 *   reports one per hydration island) and register at bootstrap via
 *   `DevtoolsModule.forInspectorSource([...])` or the
 *   `@DevtoolsInspectorSource(...)` decorator.
 *
 *   The three interfaces live in one file per `code-standards.md`'s
 *   composite-family grouping exception — each inner shape is only
 *   used in service of the outer registry contract.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Region — one outlined element in the inspector overlay
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A single inspectable region reported by a source.
 *
 * `bounds` is either a snapshot `DOMRect` or a lazy accessor — the
 * shell only calls the accessor when the overlay renders, so a source
 * that walks the DOM to measure its regions never pays that cost when
 * the inspector is closed.
 */
export interface IDevtoolsInspectorRegion {
  /** Stable region id — unique inside its source. */
  readonly id: string;
  /** Human-readable label — shown in the tooltip on hover. */
  readonly label: string;
  /** Owning panel id — activated when the user clicks the region. */
  readonly panelId: string;
  /**
   * Bounding rect — either a snapshot or a lazy getter. Returning
   * `null` from the getter tells the shell to skip this region for
   * the current render (element has been removed / not yet mounted).
   */
  readonly bounds: DOMRect | (() => DOMRect | null);
  /** Optional CSS colour applied to the region's outline. */
  readonly accent?: string;
  /** Free-form metadata surfaced when the region is inspected. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ════════════════════════════════════════════════════════════════════════════════
// Source — contributes a list of regions
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A source of inspector regions — one per feature package that has
 * runtime state to visualise.
 *
 * Sources are polled: `collect()` is called on inspector open and on
 * manual refresh. Sources SHOULD keep `collect()` cheap; expensive
 * measurement work belongs behind the region's lazy `bounds` getter.
 */
export interface IDevtoolsInspectorRegionSource {
  /** Stable source id — `'scope'`, `'ssr-hydration'`, etc. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Owning panel id — opened when a region under this source is clicked. */
  readonly panelId: string;
  /** Enumerate the current regions. */
  collect(): readonly IDevtoolsInspectorRegion[];
}

// ════════════════════════════════════════════════════════════════════════════════
// Registry — holds every source
// ════════════════════════════════════════════════════════════════════════════════

/**
 * The inspector registry — holds every registered
 * {@link IDevtoolsInspectorRegionSource}.
 *
 * `collectAll()` fans out to every source and flattens the results.
 * The shell wraps this in a `useSyncExternalStore` for tearing-free
 * reads under concurrent React.
 */
export interface IDevtoolsInspectorRegistry {
  /** Register a region source. Last-wins per `source.id`. */
  register(source: IDevtoolsInspectorRegionSource): void;
  /** Unregister a source (no-op when absent). */
  unregister(sourceId: string): void;
  /** Every registered source. */
  sources(): readonly IDevtoolsInspectorRegionSource[];
  /** Fan-out `collect()` and flatten the results. */
  collectAll(): readonly IDevtoolsInspectorRegion[];
  /** Subscribe to registry mutations. Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;
}
