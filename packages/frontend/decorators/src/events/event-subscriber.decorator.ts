/**
 * @file event-subscriber.decorator.ts
 * @module @stackra/decorators/events
 *
 * @description
 * The `@EventSubscriber(map)` class decorator — declares a map of
 * event names → method names on the class. The event-listener
 * loader reads the map at bootstrap and wires each event to its
 * corresponding method call.
 */

import { EVENT_SUBSCRIBER_METADATA_KEY, type IEventSubscriberMap } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Declare a class as a discoverable event subscriber with a
 * event-name → method-name mapping.
 *
 * @param events - Object mapping event names to method names on
 *   the class.
 * @returns A `ClassDecorator` that stamps the map + applies
 *   `@Injectable()`.
 *
 * @example
 * ```typescript
 * import { EventSubscriber } from '@stackra/decorators/events';
 *
 * @EventSubscriber({
 *   'user.created': 'onUserCreated',
 *   'user.deleted': 'onUserDeleted',
 * })
 * export class UserEventSubscribers {
 *   public onUserCreated(payload: UserCreated): void { … }
 *   public onUserDeleted(payload: UserDeleted): void { … }
 * }
 * ```
 */
export const EventSubscriber = createDiscoverableClassDecorator<IEventSubscriberMap>(
  EVENT_SUBSCRIBER_METADATA_KEY,
);

/** Reader for `@EventSubscriber(...)` metadata. */
export const eventSubscriberMetadata = createMetadataReader<IEventSubscriberMap>(
  EVENT_SUBSCRIBER_METADATA_KEY,
);
