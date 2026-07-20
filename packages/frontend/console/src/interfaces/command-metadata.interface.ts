/**
 * @file command-metadata.interface.ts
 * @module @stackra/console/interfaces
 * @description Metadata shape stored by the @Command() decorator.
 *   Retrieved by the CommandLoader during auto-discovery to register
 *   commands in the CommandRegistry.
 */

import type { IArgumentDefinition } from "./argument-definition.interface";
import type { IOptionDefinition } from "./option-definition.interface";

/**
 * Command metadata stored via `@vivtel/metadata`.
 *
 * Defines the complete signature of a console command including
 * its name, description, arguments, options, and parent hierarchy.
 */
export interface ICommandMetadata {
  /** Fully qualified command name (colon-separated, e.g., 'config:publish'). */
  name: string;

  /** Human-readable description shown in help output. */
  description: string;

  /** Positional argument definitions. */
  arguments?: IArgumentDefinition[];

  /** Named option definitions. */
  options?: IOptionDefinition[];

  /** Parent command name for subcommand registration. */
  parent?: string;
}
