/**
 * @file create-metadata-class-decorator.util.ts
 * @module @stackra/decorators/core
 *
 * @description
 * Factory that produces class-level metadata-only decorators —
 * variants that DO NOT apply `@Injectable()`. Used for classes that
 * describe data / policy / configuration rather than injectable
 * services:
 *
 *   * `@Setting(...)` — settings DTO
 *   * `@CspPolicy(...)` — CSP feature policy DTO
 *   * `@Route(...)` / `@ApiRoute(...)` — route metadata DTO
 *   * `@Middleware(...)` — SSR middleware descriptor
 *
 * The distinction from {@link createDiscoverableClassDecorator} is
 * intentional. Discoverable classes are constructable by the
 * container (and therefore need `@Injectable()`). Data classes are
 * just annotated shapes — applying `@Injectable()` would advertise
 * them as providers when they aren't.
 *
 * ## Inheritance
 *
 * Same semantics as {@link createDiscoverableClassDecorator} — the
 * stamp lives on the target class; subclasses inherit through the
 * prototype chain unless they re-decorate.
 */

import { defineMetadata } from "@vivtel/metadata";

/**
 * Options accepted by {@link createMetadataClassDecorator}.
 */
export interface ICreateMetadataClassDecoratorOverrides<Options> {
  /**
   * Optional secondary discovery-flag key stamped as `true`. Useful
   * for domains that want a distinct "is this decorated at all"
   * marker alongside the options payload (see `@Middleware` which
   * stamps both `MIDDLEWARE_METADATA_KEY` + `MIDDLEWARE_DISCOVERY_KEY`).
   */
  readonly discoveryKey?: string | symbol;
  /**
   * Transform the caller's options before stamping. Defaults to
   * identity.
   */
  readonly normalizeOptions?: (options: Options, target: Function) => Options;
}

/**
 * Build a class-level metadata-only decorator.
 *
 * @param metadataKey The primary metadata key. Typically lives in
 *   `@stackra/contracts`.
 * @param overrides   Optional secondary discovery key + options
 *   normaliser.
 * @returns A function that accepts options and returns a
 *   `ClassDecorator`. Unlike
 *   {@link createDiscoverableClassDecorator}, does NOT apply
 *   `@Injectable()`.
 *
 * @example
 * ```typescript
 * // For a DTO / data class:
 * export const Setting =
 *   createMetadataClassDecorator<ISettingOptions>(SETTING_METADATA_KEY);
 * ```
 */
export function createMetadataClassDecorator<Options>(
  metadataKey: string | symbol,
  overrides: ICreateMetadataClassDecoratorOverrides<Options> = {},
): (options: Options) => ClassDecorator {
  return (options: Options) => (target: Function) => {
    const value = overrides.normalizeOptions
      ? overrides.normalizeOptions(options, target)
      : options;
    defineMetadata(metadataKey, value, target);

    if (overrides.discoveryKey) {
      defineMetadata(overrides.discoveryKey, true, target);
    }
  };
}
