/**
 * @file unknown-command.error.ts
 * @module @stackra/console/errors
 * @description Error thrown when an unrecognized command name is dispatched.
 */

import { ConsoleError } from "./console.error";

/**
 * Thrown when the user invokes a command name that does not exist
 * in the CommandRegistry. Includes suggestions for similar names.
 */
export class UnknownCommandError extends ConsoleError {
  /**
   * @param commandName - The unrecognized command name
   * @param suggestions - Array of similar command names (fuzzy matches)
   */
  public constructor(
    public readonly commandName: string,
    public readonly suggestions: string[] = [],
  ) {
    const suggestionText =
      suggestions.length > 0 ? `\n\nDid you mean one of these?\n  ${suggestions.join("\n  ")}` : "";

    super(`Command "${commandName}" is not defined.${suggestionText}`);
    this.name = "UnknownCommandError";
  }
}
