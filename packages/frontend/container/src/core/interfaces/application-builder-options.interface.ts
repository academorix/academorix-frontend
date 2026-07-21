/**
 * @file application-builder-options.interface.ts
 * @module @stackra/container/core/interfaces
 * @description Options for the ApplicationBuilder bootstrap sequence.
 */

/**
 * Options passed to ApplicationFactory.create() during boot.
 */
export interface IApplicationBuilderOptions {
  /** Enable debug mode (exposes context on window). */
  debug?: boolean;
  /** Register shutdown hooks. Default: true. */
  shutdownHooks?: boolean;
  /** Global name for window exposure in dev. Default: '__STACKRA__'. */
  globalName?: string;
  /** Application-level config object (available via APP_CONFIG token). */
  config?: Record<string, unknown>;
  /** Preview mode — scan only, no instantiation. */
  preview?: boolean;
}
