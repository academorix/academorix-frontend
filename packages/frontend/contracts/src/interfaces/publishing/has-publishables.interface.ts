/**
 * @file has-publishables.interface.ts
 * @module @stackra/contracts/interfaces/publishing
 * @description Documentation shape for module classes that ship
 *   publishable resources. Modules declare a static method matching
 *   this shape; the console's `PublishableLoader` probes each module
 *   class with `typeof M.configurePublishables === 'function'`.
 *
 *   The interface is documentation + type-guidance — TypeScript can't
 *   type-check static methods against an instance-facing interface, so
 *   the loader duck-types at runtime.
 */

import type { IPublishableConsumer } from "./publishable-consumer.interface";

/**
 * Documentation-only shape for a module class that ships publishable
 * resources. The method is **static**, so TypeScript's `implements`
 * clause CANNOT enforce it — `class M implements IHasPublishables` is
 * a compile error because `implements` targets the instance side of
 * a class, not the constructor side.
 *
 * Modules therefore DO NOT declare `implements IHasPublishables`.
 * Instead they define `public static configurePublishables(...)` and
 * the console's `PublishableLoader` duck-types at runtime with
 * `typeof M.configurePublishables === 'function'`.
 *
 * We keep the interface (and this file) so:
 *  - IDE hovers on the loader's probe point at a real symbol with
 *    documentation.
 *  - Module authors have a canonical signature to copy.
 *  - Future TypeScript proposals that add static-side conformance
 *    (or a `satisfies` variant for constructors) can slot in without
 *    a rename.
 *
 * If you want a compile-time static-side check today, use `satisfies`:
 *
 * @example
 * ```typescript
 * const _staticCheck = RoutingModule satisfies { configurePublishables: (c: IPublishableConsumer) => void };
 * ```
 *
 * Canonical usage:
 *
 * @example
 * ```typescript
 * import { fileURLToPath } from "node:url";
 * import path from "node:path";
 *
 * import { Module } from "@stackra/container";
 * import type { IPublishableConsumer } from "@stackra/contracts";
 *
 * const PACKAGE_ROOT = path.resolve(
 *   path.dirname(fileURLToPath(import.meta.url)),
 *   "../../..",
 * );
 *
 * @Module({...})
 * export class RoutingModule {
 *   public static configurePublishables(consumer: IPublishableConsumer): void {
 *     consumer.publish({
 *       tag: "routing-config",
 *       packageRoot: PACKAGE_ROOT,
 *       files: [{ from: "config/routing.config.ts", to: "config/routing.config.ts" }],
 *     });
 *   }
 * }
 * ```
 */
export interface IHasPublishables {
  /**
   * Register every publishable resource the module owns.
   *
   * @param consumer - Fluent builder handed by the loader; register
   *   one entry per tag via `.publish({...})`.
   */
  configurePublishables(consumer: IPublishableConsumer): void;
}
