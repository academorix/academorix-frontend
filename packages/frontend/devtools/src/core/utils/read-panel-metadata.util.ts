/**
 * @file read-panel-metadata.util.ts
 * @module @stackra/devtools/core/utils
 * @description Read the `@DevtoolsPanel(...)` metadata attached to a
 *   class via `@vivtel/metadata`.
 *
 *   Wrapped in its own util so both the decorator (which writes)
 *   and the discovery loader (which reads) share one canonical
 *   lookup — if we ever swap the metadata provider, both sides
 *   update in one place.
 */

import { getMetadata } from "@vivtel/metadata";
import { DEVTOOLS_PANEL_METADATA_KEY } from "@stackra/contracts";

import type { IDevtoolsPanelOptions } from "../interfaces/devtools-panel-options.interface";

/**
 * Read the panel-decorator metadata off a class or a resolved
 * instance's `constructor`.
 *
 * @param target - Either the class itself (constructor) or the
 *   `.constructor` of a resolved instance.
 * @returns The stamped `IDevtoolsPanelOptions`, or `null` when the
 *   class was not decorated with `@DevtoolsPanel(...)`.
 */
export function readPanelMetadata(target: object | Function): IDevtoolsPanelOptions | null {
  // `getMetadata` accepts any object-y target; guard against
  // primitives that could sneak in from a discovery scan.
  if (target === null || target === undefined) return null;
  const raw = getMetadata(DEVTOOLS_PANEL_METADATA_KEY, target as object);
  if (!raw || typeof raw !== "object") return null;
  return raw as IDevtoolsPanelOptions;
}
