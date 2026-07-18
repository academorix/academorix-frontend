/**
 * @file command-cancelled.error.ts
 * @module @stackra/console/errors
 * @description Error thrown when a user cancels an interactive prompt (Ctrl+C)
 *   or when an interactive method is called in a non-TTY environment.
 */

import { ConsoleError } from "./console.error";

/**
 * Thrown when the user cancels an interactive prompt or the environment
 * does not support interactive input (non-TTY).
 *
 * Exit code: 130 (standard for SIGINT)
 */
export class CommandCancelledError extends ConsoleError {
  /** Process exit code associated with this error. */
  public readonly exitCode = 130;

  /**
   * @param message - Description of why the command was cancelled
   */
  public constructor(message: string = "Command was cancelled by the user.") {
    super(message);
    this.name = "CommandCancelledError";
  }
}
