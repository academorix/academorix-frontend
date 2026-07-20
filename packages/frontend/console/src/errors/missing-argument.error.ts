/**
 * @file missing-argument.error.ts
 * @module @stackra/console/errors
 * @description Error thrown when a required command argument is not provided.
 */

import { ConsoleError } from "./console.error";

/**
 * Thrown at runtime when a required positional argument is not provided
 * to a command invocation.
 */
export class MissingArgumentError extends ConsoleError {
  /**
   * @param argumentName - Name of the missing argument
   * @param commandName - Name of the command expecting the argument
   */
  public constructor(
    public readonly argumentName: string,
    public readonly commandName: string,
  ) {
    super(
      `Missing required argument "${argumentName}" for command "${commandName}". ` +
        `Run "${commandName} --help" for usage information.`,
    );
    this.name = "MissingArgumentError";
  }
}
