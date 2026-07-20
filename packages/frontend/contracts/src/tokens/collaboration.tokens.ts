/**
 * @file collaboration.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the real-time collaboration subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (activity
 *   feeds, presence indicators, analytics collectors) can inject the
 *   room manager without pulling in the runtime package.
 */

/** Token for the RoomManager singleton (presence, cursors, threads). */
export const COLLABORATION_ROOM_MANAGER = Symbol.for("COLLABORATION_ROOM_MANAGER");

/** Token for the collaboration module configuration. */
export const COLLABORATION_CONFIG = Symbol.for("COLLABORATION_CONFIG");
