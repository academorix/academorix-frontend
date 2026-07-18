/**
 * @file registered-command.interface.ts
 * @module @stackra/console/interfaces
 * @description Shape for a command entry stored in the CommandRegistry.
 */

import type { IArgumentDefinition } from "./argument-definition.interface";
import type { IOptionDefinition } from "./option-definition.interface";

/**
 * A fully resolved and registered command entry.
 *
 * Stored in the CommandRegistry after auto-discovery. Contains all
 * metadata needed for help rendering, dispatch, and subcommand association.
 */
export interface IRegisteredCommand {
  /** Fully qualified command name (e.g., 'config:publish'). */
  name: string;

  /** Human-readable description. */
  description: string;

  /** Parsed namespace (prefix before first colon, empty string if no colon). */
  namespace: string;

  /** Positional argument definitions. */
  arguments: IArgumentDefinition[];

  /** Named option definitions. */
  options: IOptionDefinition[];

  /** Reference to the command class constructor. */
  classRef: Function;

  /** Source package name for attribution in help output. */
  sourcePackage?: string;

  /** Parent command name (for subcommands). */
  parent?: string;

  /** Child subcommand names. */
  subcommands: string[];
}
