/**
 * @file devtools-panels-registry.interface.ts
 * @module @stackra/contracts/interfaces/devtools
 * @description Devtools panel registry contract.
 */

import type { DevtoolsCategory } from "../../types/devtools-category.type";
import type { IDevtoolsPanel } from "./devtools-panel.interface";

/**
 * Cross-package registry that holds every registered
 * {@link IDevtoolsPanel} and notifies subscribers on change.
 *
 * Inject via `@Inject(DEVTOOLS_REGISTRY)` — the token is bound to
 * `DevtoolsPanelsRegistry` inside `@stackra/devtools`.
 *
 * Registration is **last-wins per `panel.id`** — a re-register with
 * the same id replaces the earlier entry silently. This makes the
 * combination of discovery-scan + `forFeature` seed-loader safe:
 * whichever path arrives second is a no-op after the first has run.
 *
 * The `list()` snapshot returns a stable array reference — the
 * identity only changes when the registry mutates, matching the
 * `useSyncExternalStore` contract.
 */
export interface IDevtoolsPanelsRegistry {
  /** Register (or replace) a panel. */
  register(panel: IDevtoolsPanel): void;
  /** Unregister the panel with the given id (no-op when absent). */
  unregister(id: string): void;
  /** Every registered panel, sorted by `(category order, panel.order)`. */
  list(): readonly IDevtoolsPanel[];
  /** Panels grouped by their {@link DevtoolsCategory}. */
  byCategory(): ReadonlyMap<DevtoolsCategory, readonly IDevtoolsPanel[]>;
  /** Find a panel by id, or `null` if not registered. */
  find(id: string): IDevtoolsPanel | null;
  /** Subscribe to registry mutations. Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;
}
