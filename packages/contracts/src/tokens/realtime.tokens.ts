/**
 * @file realtime.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the realtime WebSocket subsystem.
 *
 *   These tokens live in contracts (not `@stackra/realtime`) so
 *   cross-package consumers can inject the realtime manager without
 *   pulling in the runtime — same pattern as CACHE_MANAGER, EVENT_EMITTER.
 */

/** Token for the RealtimeManager singleton. */
export const REALTIME_MANAGER = Symbol.for("REALTIME_MANAGER");

/** Token for the realtime module configuration. */
export const REALTIME_CONFIG = Symbol.for("REALTIME_CONFIG");
