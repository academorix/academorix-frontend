/**
 * @file parsed-argv.interface.ts
 * @module @stackra/console/src/interfaces
 * @description ParsedArgv interface.
 */

/** Parsed command-line arguments. */
export interface ParsedArgv {
  /** The command name (first non-flag argument, e.g., 'migration:run'). */
  commandName: string | null;
  /** Positional arguments after the command name. */
  args: Record<string, string>;
  /** Named options (--key value, --flag, -k value). */
  options: Record<string, string | boolean>;
}
