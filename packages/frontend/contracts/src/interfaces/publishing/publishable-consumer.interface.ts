/**
 * @file publishable-consumer.interface.ts
 * @module @stackra/contracts/interfaces/publishing
 * @description Builder-style consumer the console's `PublishableLoader`
 *   hands to every module's `static configurePublishables(consumer)`
 *   method. Modules call `consumer.publish(entry)` once per tag they
 *   want to expose.
 */

import type { IPublishableEntry } from "./publishable-entry.interface";

/**
 * Fluent builder handed to `static configurePublishables(consumer)` on
 * every module that ships publishable resources.
 *
 * Every call to `publish(entry)` returns the same consumer so modules
 * can chain multiple registrations in one method body:
 *
 * @example
 * ```typescript
 * public static configurePublishables(consumer: IPublishableConsumer): void {
 *   consumer
 *     .publish({ tag: "routing-config", ... })
 *     .publish({ tag: "routing-stubs", ... });
 * }
 * ```
 *
 * The consumer is stateless per-invocation — the loader creates a fresh
 * instance per `configurePublishables()` call so a module can't leak
 * partial registration state to the next module.
 */
export interface IPublishableConsumer {
  /**
   * Register one publishable entry with the registry.
   *
   * @param entry - The publishable manifest to register.
   * @returns This consumer, for chaining.
   */
  publish(entry: IPublishableEntry): IPublishableConsumer;
}
