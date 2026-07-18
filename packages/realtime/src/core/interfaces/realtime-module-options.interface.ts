/**
 * @file realtime-module-options.interface.ts
 * @module @stackra/realtime/core/interfaces
 * @description Full module-level configuration for the realtime system.
 *   Defines connections, reconnection behavior, authentication, and defaults.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Per-connection configuration.
 *
 * Each connection corresponds to one WebSocket server endpoint.
 * The `driver` field determines which connector handles the transport.
 */
export interface IRealtimeConnectionConfig {
  /** Driver name (e.g., 'socketio', 'pusher', 'ably'). */
  driver: string;

  /** Server URL to connect to (e.g., 'wss://api.example.com'). */
  url?: string;

  /**
   * Whether to connect automatically on module init.
   * When false, you must call `manager.connection()` explicitly.
   *
   * @default true
   */
  autoConnect?: boolean;

  /**
   * WebSocket namespace to connect to (Socket.IO specific).
   * Isolates traffic from other namespaces on the same server.
   *
   * @default '/'
   */
  namespace?: string;

  /**
   * Authentication configuration for private/presence channels.
   * The token is sent in the WebSocket handshake.
   */
  auth?: {
    /** Authentication token (JWT or API key). */
    token?: string;
    /** Custom headers to include in the handshake. */
    headers?: Record<string, string>;
  };

  /**
   * Reconnection behavior when the connection drops.
   */
  reconnection?: {
    /** Whether to attempt automatic reconnection. @default true */
    enabled?: boolean;
    /** Maximum number of reconnection attempts. @default Infinity */
    maxAttempts?: number;
    /** Initial delay (ms) before first reconnection attempt. @default 1000 */
    delay?: number;
    /** Maximum delay (ms) between attempts (exponential backoff cap). @default 30000 */
    maxDelay?: number;
  };

  /** Allow additional driver-specific options. */
  [key: string]: unknown;
}

/**
 * Top-level configuration for `RealtimeModule.forRoot()`.
 */
export interface IRealtimeModuleOptions {
  /**
   * Default connection name.
   */
  default: string;

  /**
   * Named connection configurations.
   */
  connections: Record<string, IRealtimeConnectionConfig>;

  /**
   * Whether to emit lifecycle events (connected, disconnected, error)
   * through `@stackra/events` EventEmitter.
   *
   * @default true
   */
  emitLifecycleEvents?: boolean;
}
