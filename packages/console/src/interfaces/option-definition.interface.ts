/**
 * @file option-definition.interface.ts
 * @module @stackra/console/interfaces
 * @description Shape for named option definitions in a command signature.
 */

/**
 * A named option definition for a console command.
 *
 * Options are prefixed with `--` (long form) and optionally `-` (short alias).
 * They can be strings, booleans, or numbers.
 */
export interface IOptionDefinition {
  /** Option name prefixed with '--' (e.g., '--force'). */
  name: string;

  /** Short alias prefixed with '-' (e.g., '-f'). */
  short?: string;

  /** Description shown in help output. */
  description: string;

  /** Value type: 'string', 'boolean', or 'number'. */
  type: "string" | "boolean" | "number";

  /** Default value when option is not provided. */
  default?: unknown;
}
