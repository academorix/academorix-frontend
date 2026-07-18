/**
 * @file application-factory-options.interface.ts
 * @module @stackra/container/src/interfaces
 * @description Options for ApplicationFactory.create().
 */

import type { IContainerLoggerOptions } from "./container-logger-options.interface";

/**
 * Options for ApplicationFactory.create().
 */
export interface IApplicationFactoryOptions {
  /** Optional name for this application context. */
  name?: string;
  /** Logger options for the bootstrap process. */
  logging?: IContainerLoggerOptions;
  /** Application configuration (injected as APP_CONFIG token). */
  config?: Record<string, unknown>;
  /** Preview mode (no lifecycle hooks). */
  preview?: boolean;
  /** Debug mode — enables verbose logging. */
  debug?: boolean;
  /** Global context name. */
  globalName?: string;
  /** Register shutdown signal handlers. */
  shutdownHooks?: boolean;
  /** Auto-flush logs on shutdown. */
  autoFlushLogs?: boolean;
  /** Buffer logs until bootstrap completes. */
  bufferLogs?: boolean;
  /** Callback invoked after bootstrap. */
  onReady?: (context: unknown) => void | Promise<void>;
}
