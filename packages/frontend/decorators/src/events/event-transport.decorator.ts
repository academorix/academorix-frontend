/**
 * @file event-transport.decorator.ts
 * @module @stackra/decorators/events
 *
 * @description
 * The `@EventTransport(options)` class decorator — marks a class as
 * a discoverable event transport (WebSocket, SSE, BroadcastChannel,
 * ...) that injects events into the local emitter.
 */

import { EVENT_TRANSPORT_METADATA_KEY, type IEventTransportOptions } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Mark a class as a discoverable event transport.
 *
 * @param options - Transport metadata.
 * @returns A `ClassDecorator` that stamps the options + applies
 *   `@Injectable()`.
 *
 * @example
 * ```typescript
 * import { EventTransport } from '@stackra/decorators/events';
 * import type { IEventEmitterSync, IEventTransport } from '@stackra/contracts';
 *
 * @EventTransport({ name: 'broadcast-channel' })
 * export class BroadcastChannelTransport implements IEventTransport {
 *   public connect(emitter: IEventEmitterSync): void { … }
 *   public disconnect(): void { … }
 * }
 * ```
 */
export const EventTransport = createDiscoverableClassDecorator<IEventTransportOptions>(
  EVENT_TRANSPORT_METADATA_KEY,
);

/** Reader for `@EventTransport(...)` metadata. */
export const eventTransportMetadata = createMetadataReader<IEventTransportOptions>(
  EVENT_TRANSPORT_METADATA_KEY,
);
