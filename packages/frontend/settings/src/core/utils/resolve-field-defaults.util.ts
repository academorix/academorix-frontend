/**
 * @file resolve-field-defaults.util.ts
 * @module @stackra/settings/core/utils
 * @description Build a `Record<fieldKey, defaultValue>` from a
 *   resolved `ISettingDefinition`. Used by the service on cache miss
 *   to seed sync reads before the underlying store has hydrated.
 */

import type { ISettingDefinition } from '@stackra/contracts';

/**
 * Build a `{ [fieldKey]: defaultValue }` map from a resolved
 * definition. The returned record is a fresh object — callers are
 * free to mutate it without leaking back into the definition.
 */
export function resolveFieldDefaults(definition: ISettingDefinition): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of definition.fields) {
    defaults[field.key] = field.defaultValue;
  }
  return defaults;
}
