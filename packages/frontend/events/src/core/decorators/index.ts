/**
 * @file index.ts
 * @module @stackra/events/core/decorators
 *
 * @description
 * Barrel export for event decorators. Each decorator now re-exports
 * from `@stackra/decorators/events`; the local file just proxies so
 * legacy import paths keep working.
 */
export { OnEvent } from "./on-event.decorator";
export { EventTransport } from "./event-transport.decorator";
export { InjectEventEmitter } from "./inject-event-emitter.decorator";
export { EventSubscriber } from "./event-subscriber.decorator";

// Contract tokens + shapes previously re-exported here have been
// retired. Import `EVENT_SUBSCRIBER_METADATA_KEY` +
// `IEventSubscriberMap` directly from `@stackra/contracts` per
// `.kiro/steering/contract-reexports.md`.
