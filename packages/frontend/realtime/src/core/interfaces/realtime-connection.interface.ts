/**
 * @file realtime-connection.interface.ts
 * @module @stackra/realtime/core/interfaces
 * @description Backwards-compat re-export of the realtime channel /
 *   connection contracts.
 *
 *   The canonical source of truth is `@stackra/contracts/interfaces/realtime`.
 *   This file exists only to preserve the existing
 *   `@stackra/realtime` public API for consumers that still import
 *   these shapes from the runtime package. Per
 *   `.kiro/steering/contract-reexports.md`, the retrofit sweep will
 *   drop this pass-through in a minor bump of `@stackra/realtime`.
 */

export type {
  IRealtimeChannel,
  IRealtimeConnection,
  IRealtimePresenceChannel,
} from "@stackra/contracts";
