/**
 * @file index.ts
 * @stackra/collaboration
 *
 * Liveblocks-style collaboration features with a transport abstraction layer.
 * Provides real-time presence, cursors, typing indicators, shared state,
 * threads, notifications, and activity feeds.
 *
 * @example
 * ```typescript
 * import {
 *   CollaborationModule,
 *   useRoom,
 *   useCursors,
 *   useTypingIndicator,
 *   useSharedState,
 *   useThreads,
 *   useNotifications,
 *   useActivityFeed,
 * } from '@stackra/collaboration';
 * ```
 *
 * @module @stackra/collaboration
 */

// ============================================================================
// Module
// ============================================================================
export { CollaborationModule } from "./collaboration.module";

// ============================================================================
// Services
// ============================================================================
export { RoomManager } from "./services";

// ============================================================================
// Hooks
// ============================================================================
export {
  useRoom,
  useCursors,
  useTypingIndicator,
  useSharedState,
  useThreads,
  useNotifications,
  useActivityFeed,
} from "./hooks";

// ============================================================================
// Transports
// ============================================================================
export { BroadcastChannelTransport, ReverbTransport, MockTransport } from "./transports";

// ============================================================================
// Interfaces
// ============================================================================
export type {
  CollaborationTransport,
  RoomMember,
  RoomOptions,
  CursorPosition,
  SharedStateOptions,
  Thread,
  ThreadMessage,
  CollaborationNotification,
} from "./interfaces";

// ============================================================================
// Types
// ============================================================================
export type { ActivityEntry } from "./types";
