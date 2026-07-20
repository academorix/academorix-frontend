/**
 * @file events.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the event system.
 */

/** Token for the EventEmitter instance. */
export const EVENT_EMITTER = Symbol.for("EVENT_EMITTER");

// NOTE: `EVENT_EMITTER_CONFIG` used to live here. It was removed in
// the `@stackra/config` migration — `EventEmitterModule.forRoot` now
// binds the resolved config under a package-internal symbol
// (`EVENT_EMITTER_CONFIG_INTERNAL` in `@stackra/events`) and consumers
// who want to read the same value do so via
// `@Inject(eventsConfig.KEY)` on an app-owned `registerAs(...)`
// factory. See `.kiro/specs/stackra-config-package/PLAN.md` §5.2.

/**
 * Metadata key stamped by the `@OnEvent(...)` method decorator on
 * a class's prototype for each decorated method. The listener
 * loader reads it via `getMetadata(EVENT_LISTENER_METADATA_KEY,
 * prototype, methodName)`.
 *
 * Multiple `@OnEvent(...)` applications on the same method
 * accumulate via `updateMetadata` — the payload is an array of
 * `IOnEventMetadata` entries.
 */
export const EVENT_LISTENER_METADATA_KEY = "stackra:events:listener";

/**
 * Metadata key stamped by the `@EventTransport(options)` class
 * decorator. `EventSubscribersLoader` reads it via
 * `discovery.getProvidersByMetadata(EVENT_TRANSPORT_METADATA_KEY)`
 * at bootstrap.
 */
export const EVENT_TRANSPORT_METADATA_KEY = "stackra:events:transport";

/**
 * Metadata key stamped by the `@EventSubscriber(map)` class
 * decorator. The payload is the event-to-method map.
 */
export const EVENT_SUBSCRIBER_METADATA_KEY = "stackra:events:subscriber";
