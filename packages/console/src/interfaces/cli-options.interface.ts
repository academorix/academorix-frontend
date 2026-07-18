/**
 * @file cli-options.interface.ts
 * @module @stackra/console/interfaces
 * @description Options accepted by `ConsoleKernel.run(...)` — the CLI's
 *   top-level entry point. Controls container log levels and lets consumers
 *   hook into the boot lifecycle before command dispatch.
 */

import type { ApplicationContext } from "@stackra/container";

/**
 * Options for CLI mode execution.
 */
export interface ICliOptions {
  /**
   * Container log levels shown during boot. Defaults to `["error"]` so a
   * plain CLI invocation is quiet unless something goes wrong.
   */
  readonly logLevels?: readonly string[];

  /**
   * Hook called after the container boots but before command dispatch.
   * Use this to configure the discovered command set, prime caches,
   * or install ad-hoc providers on the container.
   */
  readonly beforeBoot?: (app: ApplicationContext) => Promise<void>;
}
