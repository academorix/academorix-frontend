/**
 * @file index.ts
 * @module @stackra/events/core/interfaces
 * @description Barrel export for events core interfaces owned by
 *   this package. Contract shapes (`IOnEventMetadata`,
 *   `IOnEventOptions`, `IEventSubscriberMap`,
 *   `IEventTransportOptions`) are NOT re-exported here — import them
 *   directly from `@stackra/contracts` per
 *   `.kiro/steering/contract-reexports.md`.
 */
export type { IEventEmitterConfig } from "./event-emitter-config.interface";
export type { IEventTransport } from "./event-transport-options.interface";
export type { IListenerEntry, EventListener } from "./listener-entry.interface";
