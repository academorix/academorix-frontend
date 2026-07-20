/**
 * @file invalid-command-name.error.ts
 * @module @stackra/console/errors
 * @description Error thrown when a command name contains invalid characters.
 */

import { ConsoleError } from "./console.error";

/**
 * Thrown when a command name violates the naming convention.
 *
 * Valid names: lowercase alphanumeric, colons, and hyphens.
 * Each segment (separated by colons) must start with a letter.
 *
 * @example
 * Valid:   'config:publish', 'make:command', 'queue:work'
 * Invalid: 'Config:Publish', '1config', 'queue_work', 'queue:'
 */
export class InvalidCommandNameError extends ConsoleError {
  /**
   * @param name - The invalid command name
   */
  public constructor(public readonly invalidName: string) {
    super(
      `Invalid command name "${invalidName}". Command names must contain only lowercase ` +
        `alphanumeric characters, colons, and hyphens. Each segment must start with a letter. ` +
        `Pattern: /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)*$/`,
    );
    this.name = "InvalidCommandNameError";
  }
}
