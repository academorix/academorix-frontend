/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/events
 * @description Barrel export for event system interfaces.
 */

export type { IEventEmitter } from "./event-emitter.interface";
export type { IEventEmitterSync } from "./event-emitter-sync.interface";
export type { IEventTransportOptions } from "./event-transport-options.interface";
export type { IOnEventOptions, IOnEventMetadata } from "./on-event-options.interface";
export type { IEventSubscriberMap } from "./event-subscriber-map.type";
