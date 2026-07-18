/**
 * @file host-options.interface.ts
 * @module @stackra/routing/console/interfaces
 * @description Parsed option bag for the `stackra host` command. Populated by
 *   `parseHostOptions(...)` from raw argv, or by the console framework's
 *   argv parser via `BaseCommand#option(...)`.
 */

/**
 * Normalised options for a single `stackra host` invocation.
 */
export interface IHostOptions {
  /** When `true`, remove the managed block instead of writing it. */
  readonly remove: boolean;

  /** When `true`, print the diff without touching the file. */
  readonly dryRun: boolean;

  /** Override `rootDomain` from `react-router.config.ts`. Optional. */
  readonly rootDomain?: string;
}
