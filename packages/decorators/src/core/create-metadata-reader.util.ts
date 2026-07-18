/**
 * @file create-metadata-reader.util.ts
 * @module @stackra/decorators/core
 *
 * @description
 * Companion reader helper for decorators produced by the factories
 * in this file's siblings. Returns a `{ get, has, hasOwn }` bundle
 * bound to a single metadata key.
 *
 * ## Inheritance semantics
 *
 * - `get` and `has` walk the prototype chain (standard
 *   `reflect-metadata` behaviour). A subclass that hasn't
 *   re-decorated inherits the parent's stamp.
 * - `hasOwn` checks ONLY the target — no prototype walk. Used to
 *   detect when a subclass has genuinely overridden a decorator.
 *
 * The reader is intentionally minimal. Domain-specific readers
 * (e.g. `getFieldDescriptors` which sorts the field Map) stay in
 * their domain barrel — this helper only covers the common case of
 * "read the stamped payload for a single key".
 */

import { getMetadata, hasMetadata, hasOwnMetadata } from "@vivtel/metadata";

/**
 * Metadata reader bundle returned by {@link createMetadataReader}.
 */
export interface IMetadataReader<T> {
  /**
   * Read the metadata (inheritance-aware). Returns `undefined` when
   * the target — and its entire prototype chain — carry no stamp
   * for the reader's key.
   *
   * @param target Class constructor, prototype, or any object.
   * @param propertyKey Optional property key for method / property
   *   decorators. Omit for class-level metadata.
   */
  get(target: object, propertyKey?: string | symbol): T | undefined;

  /**
   * Check if the metadata exists (inheritance-aware). Cheaper than
   * `get` when the caller only needs a boolean.
   */
  has(target: object, propertyKey?: string | symbol): boolean;

  /**
   * Check if the metadata is stamped DIRECTLY on the target — no
   * prototype walk. Useful for detecting subclass overrides:
   *
   *   const ownStamp = reader.hasOwn(SubClass);   // false when inherited
   *   const anyStamp = reader.has(SubClass);       // true when inherited or own
   */
  hasOwn(target: object, propertyKey?: string | symbol): boolean;
}

/**
 * Build a reader bundle for a single metadata key.
 *
 * @param metadataKey Key produced by one of the factory decorators
 *   in this folder — or any key stamped via `@vivtel/metadata`.
 * @returns A reader with `get`, `has`, and `hasOwn` methods.
 *
 * @example
 * ```typescript
 * const devtoolsPanelReader = createMetadataReader<IDevtoolsPanelOptions>(
 *   DEVTOOLS_PANEL_METADATA_KEY,
 * );
 *
 * const options = devtoolsPanelReader.get(SomeClass);
 * if (options) {
 *   // ... class is a devtools panel
 * }
 * ```
 */
export function createMetadataReader<T>(metadataKey: string | symbol): IMetadataReader<T> {
  return {
    get(target, propertyKey) {
      return getMetadata<T>(metadataKey, target, propertyKey);
    },
    has(target, propertyKey) {
      return hasMetadata(metadataKey, target, propertyKey);
    },
    hasOwn(target, propertyKey) {
      return hasOwnMetadata(metadataKey, target, propertyKey);
    },
  };
}
