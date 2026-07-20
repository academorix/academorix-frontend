/**
 * @file registered-command.interface.ts
 * @module @stackra/console/interfaces
 * @description Shape for a command entry stored in the CommandRegistry.
 */

import type { IArgumentDefinition } from "./argument-definition.interface";
import type { IOptionDefinition } from "./option-definition.interface";
import type { Type } from "@stackra/contracts";

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

  /**
   * Reference to the command class constructor. Typed as `Type<unknown>`
   * because the registry stores every `@Command`-decorated class and
   * consumers narrow to `BaseCommand` at the dispatch site — importing
   * `BaseCommand` here would create a cycle (registry → base → registry).
   */
  classRef: Type<unknown>;

  /** Source package name for attribution in help output. */
  sourcePackage?: string;

  /** Parent command name (for subcommands). */
  parent?: string;

  /** Child subcommand names. */
  subcommands: string[];
}
