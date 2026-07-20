/**
 * @file create-discoverable-method-decorator.util.ts
 * @module @stackra/decorators/core
 *
 * @description
 * Factory that produces method-level "annotate this method as X"
 * decorators. Used for `@OnEvent(name)`, `@Cron(expression)`,
 * `@OnJobEvent(event, queue?)`, etc.
 *
 * ## Storage model
 *
 * Options are stamped **per method** on the class prototype using
 * `@vivtel/metadata`'s `propertyKey` parameter:
 *
 *   defineMetadata(methodMetadataKey, options, target, propertyKey)
 *
 * `target` for a method decorator is the class prototype, `propertyKey`
 * is the method name. This is the standard `reflect-metadata`
 * approach and gives us inheritance for free — subclasses that
 * inherit a method (no override) inherit the metadata; subclasses
 * that override + re-decorate get their own stamp.
 *
 * ## Accumulation (stacking)
 *
 * Some decorators need to stack — `@OnEvent('a')` and `@OnEvent('b')`
 * on the same method should register the method for BOTH events.
 * Callers opt in via the `merge` option: it receives the existing
 * stored value and the incoming one and produces the new value.
 * Typically the merge appends to an array of options entries.
 *
 * Without `merge`, each application overwrites the previous one —
 * the correct behaviour when only the most recent decoration matters.
 *
 * ## The class-marker key
 *
 * `discovery.getProvidersByMetadata(KEY)` looks for metadata on the
 * CONSTRUCTOR. Method decorators stamp the prototype — so without
 * a class-level marker, discovery scanners would have to iterate
 * every provider's methods to find candidates. To keep discovery
 * O(1), the factory stamps a boolean marker on the constructor
 * under `classDiscoveryKey` (when supplied).
 *
 * ## Why NO auto-`@Injectable()`
 *
 * The class enclosing the method is a service with its own identity.
 * Applying `@Injectable()` from inside a method decorator would
 * reach out of the method's scope and mutate the class — a footgun.
 * Loaders assert `@Injectable()` is present at bootstrap and throw
 * a named error if not (see {@link assertClassIsInjectable}).
 */

import { defineMetadata, getMetadata } from "@vivtel/metadata";

/**
 * Options accepted by {@link createDiscoverableMethodDecorator}.
 */
export interface ICreateDiscoverableMethodDecoratorOverrides<Options> {
  /**
   * Optional class-level boolean marker stamped on the constructor.
   * When supplied, loaders can use
   * `discovery.getProvidersByMetadata(classDiscoveryKey)` to find
   * classes that carry at least one decorated method — avoiding a
   * full scan of every provider's methods.
   */
  readonly classDiscoveryKey?: string | symbol;
  /**
   * Merge strategy when the same method is decorated multiple times.
   * When supplied, the factory reads existing metadata on the
   * (prototype, propertyKey) pair, calls `merge(existing, incoming)`,
   * and writes the return value back. Typical shape appends the
   * incoming entry to an array of options.
   *
   * When omitted, each application overwrites the previous.
   *
   * @param existing The value currently stored on the method.
   *   `undefined` on the first application.
   * @param incoming The options produced from the current
   *   decorator application via `toOptions`.
   */
  readonly merge?: (existing: Options | undefined, incoming: Options) => Options;
}

/**
 * Build a method-level decorator.
 *
 * @param methodMetadataKey Key under which the per-method options
 *   are stamped on the prototype.
 * @param toOptions         Transforms the decorator's positional
 *   arguments into the options object stamped. For
 *   `@OnJobEvent(event, queue?)` this is
 *   `(event, queue) => ({ event, queue })`.
 * @param overrides         Optional class-marker key for discovery,
 *   and optional `merge` strategy for accumulating decorators.
 * @returns A function that accepts the caller's arguments and
 *   returns a `MethodDecorator`.
 *
 * @example
 * ```typescript
 * // Simple (last-write-wins) — @OnJobEvent stamps a single entry
 * // per method:
 * export const OnJobEvent = createDiscoverableMethodDecorator(
 *   ON_JOB_EVENT_METADATA_KEY,
 *   (event: JobEventType, queue?: string): IOnJobEventOptions =>
 *     ({ event, ...(queue ? { queue } : {}) }),
 *   { classDiscoveryKey: HAS_JOB_LISTENERS_METADATA_KEY },
 * );
 *
 * // Accumulating — @OnEvent stacks so a method can listen to
 * // multiple events:
 * export const OnEvent = createDiscoverableMethodDecorator(
 *   EVENT_LISTENER_METADATA_KEY,
 *   (event, options?): IOnEventMetadata => ({ event, options }),
 *   { merge: (existing, incoming) => [...(existing ?? []), incoming] },
 * );
 * ```
 */
export function createDiscoverableMethodDecorator<Args extends unknown[], Options>(
  methodMetadataKey: string | symbol,
  toOptions: (...args: Args) => Options,
  overrides: ICreateDiscoverableMethodDecoratorOverrides<Options> = {},
): (...args: Args) => MethodDecorator {
  return (...args: Args) =>
    (target: object, propertyKey: string | symbol) => {
      const incoming = toOptions(...args);

      // Determine the value to stamp. With no `merge`, we simply
      // overwrite. With `merge`, we read the current value (from
      // the same target — inheritance-aware via
      // `@vivtel/metadata`'s prototype walk) and let the caller
      // decide how to combine.
      const value = overrides.merge
        ? overrides.merge(getMetadata<Options>(methodMetadataKey, target, propertyKey), incoming)
        : incoming;

      // Stamp per-method options on the prototype. Standard
      // reflect-metadata storage: readers use
      // `getMetadata(methodMetadataKey, prototype, propertyKey)`.
      defineMetadata(methodMetadataKey, value, target, propertyKey);

      // Optionally stamp the class marker so container discovery
      // can find candidate classes without a full method scan.
      if (overrides.classDiscoveryKey) {
        defineMetadata(overrides.classDiscoveryKey, true, target.constructor);
      }
    };
}
