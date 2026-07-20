/**
 * @file stable-widget-instance.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Build a deterministic widget instance for a catalogue
 *   key. Same key + owner produces the same id, so a built-in
 *   dashboard's widgets keep stable ids across reloads — critical for
 *   react-grid-layout's DOM stability + drag rehydration on user
 *   overrides.
 */

import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";

/**
 * Deterministic widget instance factory. The `builtin:` id prefix
 * distinguishes framework-seeded instances from user-created ones so
 * the storage layer can safely skip built-ins when persisting.
 *
 * @param key Widget catalogue key.
 * @param ownerId Synthetic owner id.
 * @returns A stable {@link IWidgetInstance}.
 */
export function stableWidgetInstance(key: string, ownerId: string): IWidgetInstance {
  return {
    id: `builtin:${ownerId}:${key}`,
    widgetType: key,
  };
}
