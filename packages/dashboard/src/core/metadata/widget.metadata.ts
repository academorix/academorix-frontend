/**
 * @file widget.metadata.ts
 * @module @stackra/dashboard/core/metadata
 * @description Metadata-read helpers for `@Widget()`-decorated
 *   classes.
 *
 *   Consumers who need to inspect a decorated class outside of the
 *   loader (e.g. testing utilities, custom loaders in feature
 *   packages, IDE tooling that lists every widget in the workspace)
 *   go through these helpers rather than calling `getMetadata`
 *   directly — keeps the metadata key an implementation detail of
 *   this package.
 */

import type { Type } from "@stackra/contracts";
import { getMetadata } from "@vivtel/metadata";

import { WIDGET_METADATA_KEY } from "@/core/constants/widget-metadata-key.constants";
import type { IWidgetMetadata } from "@/core/interfaces/widget-metadata.interface";

/**
 * Read the `@Widget()` metadata stamped on a class.
 *
 * @param classRef - A class reference — typically the constructor of
 *   an `@Widget()`-decorated class.
 * @returns The stamped metadata, or `undefined` when the class
 *   wasn't decorated with `@Widget()`.
 *
 * @example
 * ```typescript
 * import { readWidgetMetadata } from "@stackra/dashboard";
 *
 * const metadata = readWidgetMetadata(KpiAthletesWidget);
 * if (metadata) {
 *   console.log(`Widget key: ${metadata.key}`);
 * }
 * ```
 */
export function readWidgetMetadata(classRef: Type<unknown>): IWidgetMetadata | undefined {
  return getMetadata<IWidgetMetadata>(WIDGET_METADATA_KEY, classRef);
}

/**
 * Predicate — returns `true` when the class carries `@Widget()`
 * metadata.
 *
 * Preferred over `readWidgetMetadata(x) !== undefined` at call sites
 * where the caller only cares about presence.
 *
 * @param classRef - A class reference to probe.
 * @returns `true` when `@Widget()` was applied to the class.
 */
export function hasWidget(classRef: Type<unknown>): boolean {
  return readWidgetMetadata(classRef) !== undefined;
}
