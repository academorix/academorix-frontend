/**
 * @file event-subscriber-map.type.ts
 * @module @stackra/contracts/interfaces/events
 *
 * @description
 * Payload type for the `@EventSubscriber(map)` class decorator — a
 * plain object mapping event names to method names on the
 * decorated class.
 */

/**
 * Mapping declared by `@EventSubscriber({...})`. Keys are event
 * names (string or symbol) the class handles; values are the
 * method names on the class that fire when the event is dispatched.
 *
 * @example
 * ```typescript
 * @EventSubscriber({
 *   'user.created': 'onUserCreated',
 *   'user.deleted': 'onUserDeleted',
 * })
 * @Injectable()
 * export class UserSubscribers { … }
 * ```
 */
export type IEventSubscriberMap = Readonly<Record<string, string>>;
