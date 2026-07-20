/**
 * @file duplicate-command.error.ts
 * @module @stackra/console/errors
 * @description Error thrown when two commands attempt to register with the same name.
 */

import { ConsoleError } from "./console.error";

/**
 * Thrown during bootstrap when the CommandRegistry discovers two command
 * classes with the same fully-qualified name.
 *
 * Resolution: rename one of the conflicting commands.
 */
export class DuplicateCommandError extends ConsoleError {
  /**
   * @param commandName - The conflicting command name
   * @param existingClass - Name of the already-registered class
   * @param newClass - Name of the conflicting class
   */
  public constructor(
    public readonly commandName: string,
    public readonly existingClass: string,
    public readonly newClass: string,
  ) {
    super(
      `Duplicate command name "${commandName}": already registered by "${existingClass}", ` +
        `conflicting with "${newClass}". Each command must have a unique fully-qualified name.`,
    );
    this.name = "DuplicateCommandError";
  }
}
