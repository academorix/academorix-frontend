/**
 * @file discoverable-decorator.type.ts
 * @module @stackra/container/core/interfaces
 * @description Type for decorators created by DiscoveryService.createDecorator().
 */

/**
 * A decorator factory that emits class/method-level metadata under a
 * unique `KEY` and registers class-level uses with the discovery index.
 */
export type IDiscoverableDecorator<T> = ((opts?: T) => ClassDecorator & MethodDecorator) & {
  readonly KEY: string;
};
