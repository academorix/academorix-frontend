/**
 * @file read-inspector-source-metadata.util.ts
 * @module @stackra/devtools/core/utils
 * @description Read the `@DevtoolsInspectorSource(...)` metadata
 *   attached to a class via `@vivtel/metadata`.
 */

import { getMetadata } from "@vivtel/metadata";
import { DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY } from "@stackra/contracts";

import type { IDevtoolsInspectorSourceOptions } from "../interfaces/devtools-inspector-source-options.interface";

/**
 * Read the inspector-source-decorator metadata off a class or a
 * resolved instance's `constructor`.
 *
 * @param target - Either the class itself or the resolved
 *   instance's `.constructor`.
 * @returns The stamped `IDevtoolsInspectorSourceOptions`, or `null`
 *   when the class was not decorated.
 */
export function readInspectorSourceMetadata(
  target: object | Function,
): IDevtoolsInspectorSourceOptions | null {
  if (target === null || target === undefined) return null;
  const raw = getMetadata(DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY, target as object);
  if (!raw || typeof raw !== "object") return null;
  return raw as IDevtoolsInspectorSourceOptions;
}
