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

// The old `EVENT_SUBSCRIBER_METADATA` string constant now lives in
// `@stackra/contracts` under the canonical name. Re-export both the
// legacy alias and the new name so migrations can happen at their
// own pace.
export { EVENT_SUBSCRIBER_METADATA_KEY as EVENT_SUBSCRIBER_METADATA } from "@stackra/contracts";
export type { IEventSubscriberMap } from "@stackra/contracts";
