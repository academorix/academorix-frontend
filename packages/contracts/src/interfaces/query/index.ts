/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/query
 * @description Barrel for the `@stackra/query` cross-package contract.
 *
 *   The realtime transport is provided by `@stackra/realtime`
 *   (`REALTIME_MANAGER` + `IRealtimeChannel.on/off/whisper`) — the
 *   query layer does not ship a separate `LiveProvider` abstraction.
 */

export type { IQueryClient } from "./query-client.interface";
export type { MutationMode } from "./mutation-mode.type";
export type { ILiveEvent, LiveEventType } from "./live-event.interface";
export type {
  IUndoableMutation,
  IUndoableQueue,
  UndoableQueueListener,
  UndoableQueueUnsubscribe,
  UndoableResolution,
} from "./undoable-queue.interface";
