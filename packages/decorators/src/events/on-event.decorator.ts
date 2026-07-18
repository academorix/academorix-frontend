/**
 * @file on-event.decorator.ts
 * @module @stackra/decorators/events
 *
 * @description
 * The `@OnEvent(event, options?)` method decorator — subscribes a
 * method to one or more events. Stacking is supported: multiple
 * `@OnEvent(...)` applications on the same method accumulate into
 * an array of {@link IOnEventMetadata} entries under
 * `EVENT_LISTENER_METADATA_KEY`.
 *
 * The `EventSubscribersLoader` (in `@stackra/events`) discovers
 * these at bootstrap and binds each entry to the active
 * `EventEmitter`.
 */

import {
  EVENT_LISTENER_METADATA_KEY,
  type IOnEventMetadata,
  type IOnEventOptions,
} from "@stackra/contracts";

import { createDiscoverableMethodDecorator, createMetadataReader } from "../core";

/**
 * Subscribe a method to one or more events.
 *
 * @param event Event name (string), symbol, or array of names /
 *   symbols. Symbols are useful for events defined in a shared
 *   contracts package.
 * @param options Per-listener options. See {@link IOnEventOptions}.
 * @returns A `MethodDecorator` that accumulates one
 *   {@link IOnEventMetadata} entry per application under
 *   `EVENT_LISTENER_METADATA_KEY`.
 *
 * @example
 * ```typescript
 * import { OnEvent } from '@stackra/decorators/events';
 * import { Injectable } from '@stackra/container';
 *
 * @Injectable()
 * export class OrderListener {
 *   @OnEvent('order.created')
 *   public async onOrderCreated(payload: { orderId: string }): Promise<void> { … }
 *
 *   // Stacking — the method listens to BOTH events:
 *   @OnEvent('order.created')
 *   @OnEvent('order.updated')
 *   public async onOrderChanged(payload: unknown): Promise<void> { … }
 * }
 * ```
 */
export const OnEvent = createDiscoverableMethodDecorator<
  [event: string | symbol | ReadonlyArray<string | symbol>, options?: IOnEventOptions],
  IOnEventMetadata
>(
  EVENT_LISTENER_METADATA_KEY,
  (event, options) => (options !== undefined ? { event, options } : { event }),
  {
    // Stacking: accumulate one metadata entry per application.
    merge: (existing, incoming): IOnEventMetadata => {
      // `existing` is really an array when this decorator is used
      // multiple times on the same method. First call has no existing
      // — the cast lets the merge function type-align with the
      // factory's per-entry contract; the actual stamped payload is
      // ALWAYS an array. The reader below normalises the read side.
      const list = Array.isArray(existing) ? existing : existing !== undefined ? [existing] : [];
      return [...list, incoming] as unknown as IOnEventMetadata;
    },
  },
);

/**
 * Reader for `@OnEvent(...)` metadata. Always returns an array —
 * even when the method was decorated exactly once — so consumers
 * don't have to normalise.
 *
 * @param prototype The class prototype.
 * @param propertyKey The decorated method's name.
 */
export const onEventMetadata = {
  /** Read every `@OnEvent(...)` entry stacked on the method. */
  get(prototype: object, propertyKey: string | symbol): readonly IOnEventMetadata[] {
    const raw = onEventMetadataReader.get(prototype, propertyKey);
    if (raw === undefined) return [];
    return Array.isArray(raw) ? raw : [raw];
  },
  /** Whether the method has any `@OnEvent(...)` stamped on it. */
  has(prototype: object, propertyKey: string | symbol): boolean {
    return onEventMetadataReader.has(prototype, propertyKey);
  },
  /**
   * Whether the method has an OWN stamp (not inherited from a
   * parent prototype). Useful for detecting subclass overrides.
   */
  hasOwn(prototype: object, propertyKey: string | symbol): boolean {
    return onEventMetadataReader.hasOwn(prototype, propertyKey);
  },
};

// Internal single-key reader; `onEventMetadata.get` normalises the
// raw value into an array before returning to callers.
const onEventMetadataReader = createMetadataReader<IOnEventMetadata | readonly IOnEventMetadata[]>(
  EVENT_LISTENER_METADATA_KEY,
);
