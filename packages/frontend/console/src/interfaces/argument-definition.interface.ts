/**
 * @file argument-definition.interface.ts
 * @module @stackra/console/interfaces
 * @description Shape for positional argument definitions in a command signature.
 */

/**
 * A positional argument definition for a console command.
 *
 * Arguments are positional (order matters) and may be required or optional.
 */
export interface IArgumentDefinition {
  /** Argument name used for retrieval via `argument(name)`. */
  name: string;

  /** Description shown in help output. */
  description?: string;

  /** Whether the argument must be provided. Default: true */
  required: boolean;

  /** Default value when argument is not provided. */
  default?: unknown;
}
