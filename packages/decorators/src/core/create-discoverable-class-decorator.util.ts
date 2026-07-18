/**
 * @file create-discoverable-class-decorator.util.ts
 * @module @stackra/decorators/core
 *
 * @description
 * Factory that produces class-level "make this a discoverable X"
 * decorators. Every decorator built with this factory:
 *
 *   1. Applies `@Injectable()` to the target — a discoverable class
 *      MUST be constructable by the container, so the two concerns
 *      travel together.
 *   2. Stamps the caller-supplied options under `metadataKey` via
 *      `@vivtel/metadata`.
 *   3. Optionally stamps a boolean marker under `discoveryKey` when
 *      the domain wants a distinct "is this class discoverable for
 *      role X" flag separate from the options payload.
 *
 * The runtime loader that reads the metadata lives in a separate
 * package (e.g. `@stackra/devtools`); decorators produced here do
 * NOT depend on any loader. Feature packages therefore stay
 * decoupled from the loader chain.
 *
 * ## Inheritance
 *
 * Both `defineMetadata` calls write to the target directly. Subclasses
 * inherit through the prototype chain (standard `reflect-metadata`
 * behaviour) unless they re-decorate — in which case they get their
 * own stamp and win for their own class. Parent stamps are never
 * mutated.
 */

import { defineMetadata } from "@vivtel/metadata";
import { Injectable } from "@stackra/container";

/**
 * Options accepted by {@link createDiscoverableClassDecorator}.
 */
export interface ICreateDiscoverableClassDecoratorOverrides<Options> {
  /**
   * Optional secondary metadata key stamped as `true`. Useful when
   * consumers want to answer "is this class discoverable for role
   * X" without inspecting the options payload.
   */
  readonly discoveryKey?: string | symbol;
  /**
   * Transform the caller's options before stamping. Defaults to
   * identity. Used to fill in derived defaults (e.g. `name:
   * target.name`, `priority: 50`).
   *
   * @param options The raw options the author passed to the decorator.
   * @param target  The class constructor the decorator is applied to.
   */
  readonly normalizeOptions?: (options: Options, target: Function) => Options;
}

/**
 * Build a class-level discoverable decorator.
 *
 * @param metadataKey The primary metadata key under which options are
 *   stamped. Typically lives in `@stackra/contracts`.
 * @param overrides   Optional secondary discovery key + options
 *   normaliser.
 * @returns A function that accepts options and returns a
 *   `ClassDecorator`. The returned decorator applies
 *   `@Injectable()` and stamps the metadata.
 *
 * @example
 * ```typescript
 * // In @stackra/decorators/devtools:
 * import { DEVTOOLS_PANEL_METADATA_KEY, type IDevtoolsPanelOptions } from '@stackra/contracts';
 * import { createDiscoverableClassDecorator } from '@stackra/decorators/core';
 *
 * export const DevtoolsPanel =
 *   createDiscoverableClassDecorator<IDevtoolsPanelOptions>(DEVTOOLS_PANEL_METADATA_KEY);
 *
 * // In consumer:
 * @DevtoolsPanel({ id: 'cache', title: 'Cache', category: 'framework' })
 * export class CacheDevtoolsPanel implements IDevtoolsPanel { … }
 * ```
 */
export function createDiscoverableClassDecorator<Options>(
  metadataKey: string | symbol,
  overrides: ICreateDiscoverableClassDecoratorOverrides<Options> = {},
): (options?: Options) => ClassDecorator {
  return (options = {} as Options) =>
    (target: Function) => {
      // Auto-apply @Injectable() — discoverable classes MUST be
      // constructable by the container. Idempotent when the author
      // already applied @Injectable() explicitly.
      Injectable()(target);

      // Normalize + stamp the options payload.
      const value = overrides.normalizeOptions
        ? overrides.normalizeOptions(options, target)
        : options;
      defineMetadata(metadataKey, value, target);

      // Optional: stamp a boolean marker for role-based discovery.
      if (overrides.discoveryKey) {
        defineMetadata(overrides.discoveryKey, true, target);
      }
    };
}
