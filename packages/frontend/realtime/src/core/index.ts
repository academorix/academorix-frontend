/**
 * @file index.ts
 * @module @stackra/realtime
 * @description Public API for the realtime package (core entry point).
 *   Multi-driver realtime WebSocket management — transport-agnostic.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { RealtimeModule } from './realtime.module';

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { RealtimeManager } from './services';

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { RealtimeError } from './errors';
export { RealtimeConnectionError } from './errors';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { DEFAULT_REALTIME_CONFIG } from './constants';

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type {
  IRealtimeConnection,
  IRealtimeChannel,
  IRealtimePresenceChannel,
} from './interfaces/realtime-connection.interface';
export type { IRealtimeConnector } from './interfaces';
export type { IRealtimeModuleOptions, IRealtimeConnectionConfig } from './interfaces';

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig } from './utils';

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export * from './decorators';
