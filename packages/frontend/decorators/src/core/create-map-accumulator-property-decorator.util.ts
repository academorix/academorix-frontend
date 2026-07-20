/**
 * @file create-map-accumulator-property-decorator.util.ts
 * @module @stackra/decorators/core
 *
 * @description
 * Factory that produces property-level "add this to the map on my
 * constructor" decorators. Used by `@Field`, `@Setting`-family
 * decorators, and any future per-property annotation that needs to
 * be enumerated by a reader later.
 *
 * ## Storage model
 *
 * A single `Map<string, Entry>` is stamped on the CONSTRUCTOR under
 * `metadataKey`. Each decorator application adds / merges one entry
 * keyed by the property name. Readers iterate the map to render
 * the class's fields, sections, etc.
 *
 * Storing on the constructor (rather than the prototype) keeps the
 * map's identity stable across subclass extension — subclasses that
 * re-decorate get their OWN map, and can copy from the parent via
 * `hasOwnMetadata` if they want additive inheritance.
 *
 * ## Why last-write-wins by default
 *
 * Most property decorators (`@Field`, `@Section`) are declarative
 * data — repeated application on the same property should replace,
 * not accumulate. Custom merge strategies (like `@Group`'s
 * `fieldKeys` accumulation) provide their own `merge` callback.
 */

import { defineMetadata, getMetadata } from "@vivtel/metadata";

/**
 * Options accepted by {@link createMapAccumulatorPropertyDecorator}.
 */
export interface ICreateMapAccumulatorPropertyDecoratorOverrides<Options, Entry> {
  /**
   * Transform the author's options plus the property name into the
   * entry that goes into the map. Defaults to `identity + propertyKey`.
   * Used to inject `key: propertyKey` or fill in derived defaults.
   */
  readonly toEntry?: (options: Options, propertyKey: string) => Entry;
  /**
   * Merge strategy when the same property key is decorated twice.
   * Default: last-write-wins (`(existing, incoming) => incoming`).
   * Use a custom strategy for decorators that accumulate arrays
   * (e.g. adding a field key to a visual group's `fieldKeys`).
   *
   * @param existing The entry currently stored for this property.
   * @param incoming The new entry produced from the current decorator
   *   application.
   * @returns The entry to store. The same shape is written back to
   *   the map.
   */
  readonly merge?: (existing: Entry, incoming: Entry) => Entry;
}

/**
 * Build a property-level Map-accumulator decorator.
 *
 * @param metadataKey Key of the map on the class constructor.
 * @param overrides   Optional `toEntry` transform and `merge`
 *   strategy for repeated applications.
 * @returns A function that accepts options and returns a
 *   `PropertyDecorator`. The decorator upserts one entry (keyed by
 *   the decorated property's name) into the map on the constructor.
 *
 * @example
 * ```typescript
 * // Field descriptor — one entry per property, last write wins.
 * export const Field = createMapAccumulatorPropertyDecorator<IFieldOptions, ISettingField>(
 *   FIELD_METADATA_KEY,
 *   { toEntry: (options, propertyKey) => ({ ...options, key: propertyKey }) },
 * );
 * ```
 */
export function createMapAccumulatorPropertyDecorator<Options, Entry = Options>(
  metadataKey: string | symbol,
  overrides: ICreateMapAccumulatorPropertyDecoratorOverrides<Options, Entry> = {},
): (options: Options) => PropertyDecorator {
  return (options: Options) => (target: object, propertyKey: string | symbol) => {
    // The constructor is where we hang the per-property map. This
    // ensures metadata survives class extension without leaking
    // across subclasses — each subclass gets its own map.
    const constructor = target.constructor as object;
    const key = String(propertyKey);

    const map =
      getMetadata<Map<string, Entry>>(metadataKey, constructor) ?? new Map<string, Entry>();

    // Compute the incoming entry via the user's `toEntry` transform
    // or default to using `options` directly (options === entry).
    const incoming = overrides.toEntry
      ? overrides.toEntry(options, key)
      : (options as unknown as Entry);

    const existing = map.get(key);
    if (existing !== undefined && overrides.merge) {
      map.set(key, overrides.merge(existing, incoming));
    } else {
      map.set(key, incoming);
    }

    // Re-define — `@vivtel/metadata` overwrites on set; we can
    // round-trip the same map reference every call.
    defineMetadata(metadataKey, map, constructor);
  };
}
