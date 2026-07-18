/**
 * @file assert-class-is-injectable.util.ts
 * @module @stackra/decorators/core
 *
 * @description
 * Bootstrap-time invariant asserter for method-level discoverable
 * decorators.
 *
 * Method decorators built with
 * {@link createDiscoverableMethodDecorator} deliberately do NOT
 * apply `@Injectable()` to their enclosing class — the class's
 * identity is the author's responsibility. This helper is called
 * by the domain LOADER at `onApplicationBootstrap` to fail loudly
 * (with a named class + decorator hint) when the author forgot.
 *
 * Turns a silent "why isn't my listener firing" into an actionable
 * "class UserEventListener uses @OnEvent on 3 methods but is not
 * marked @Injectable()".
 */

import { hasMetadata } from "@vivtel/metadata";
import { INJECTABLE_WATERMARK } from "@stackra/container";

/**
 * Assert that a class carrying method-level discoverable metadata
 * is also marked `@Injectable()`. Domain loaders call this on every
 * candidate class before wiring its methods.
 *
 * @param cls The class constructor to check.
 * @param options Diagnostic context — the domain's method key and a
 *   human-readable decorator name for the error message.
 * @param options.methodMetadataKey Key stamped by the method
 *   decorator. Used to detect whether the class actually has any
 *   annotated methods (otherwise the check is skipped).
 * @param options.decoratorName Human-readable name of the method
 *   decorator (e.g. `"@OnEvent"`). Used verbatim in the error.
 * @throws {Error} When the class has methods carrying the metadata
 *   key but is not marked `@Injectable()`.
 *
 * @example
 * ```typescript
 * // In @stackra/events loader:
 * for (const provider of discovery.getProvidersByMetadata(HAS_EVENT_LISTENERS_KEY)) {
 *   assertClassIsInjectable(provider.metatype, {
 *     methodMetadataKey: ON_EVENT_METADATA_KEY,
 *     decoratorName: '@OnEvent',
 *   });
 *   // ... register the listeners
 * }
 * ```
 */
export function assertClassIsInjectable(
  cls: Function,
  options: {
    readonly methodMetadataKey: string | symbol;
    readonly decoratorName: string;
  },
): void {
  // If the class has no method-level metadata, the assertion is
  // vacuous — nothing to enforce. This lets loaders call the helper
  // on every candidate without a pre-check.
  const hasMethodMeta = anyMethodCarriesMetadata(cls, options.methodMetadataKey);
  if (!hasMethodMeta) return;

  // INJECTABLE_WATERMARK is stamped by `@Injectable()` on the class.
  // Missing here means the author forgot the class-level decorator.
  const isInjectable = hasMetadata(INJECTABLE_WATERMARK, cls);
  if (isInjectable) return;

  throw new Error(
    `${cls.name} uses ${options.decoratorName} on one or more methods but is not marked @Injectable(). ` +
      `Add @Injectable() to the class so the container can construct it.`,
  );
}

/**
 * Walk the class's prototype methods looking for any method carrying
 * `methodMetadataKey`. Returns as soon as one is found — used only
 * to short-circuit the injectable assertion on classes that don't
 * actually use the domain's method decorator.
 */
function anyMethodCarriesMetadata(cls: Function, methodMetadataKey: string | symbol): boolean {
  const prototype = (cls as { prototype: object | undefined }).prototype;
  if (!prototype) return false;

  const methodNames = Object.getOwnPropertyNames(prototype).filter(
    (name) => name !== "constructor",
  );

  for (const name of methodNames) {
    if (hasMetadata(methodMetadataKey, prototype, name)) return true;
  }
  return false;
}
