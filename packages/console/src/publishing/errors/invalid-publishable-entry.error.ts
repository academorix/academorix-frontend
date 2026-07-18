/**
 * @file invalid-publishable-entry.error.ts
 * @module @stackra/console/publishing/errors
 * @description Thrown at register time when a publishable entry fails
 *   validation — bad tag, non-absolute `packageRoot`, empty `files`,
 *   absolute `from` path, ...
 */

import { ConsoleError } from "../../errors";

/**
 * A publishable entry failed validation at register time.
 *
 * The error message names the specific field that failed so the author
 * can fix the manifest without re-running the whole publish flow.
 */
export class InvalidPublishableEntryError extends ConsoleError {
  /**
   * @param field - The offending field (`"tag"`, `"packageRoot"`,
   *   `"files"`, `"from"`, ...).
   * @param reason - Human-readable reason the value was rejected.
   * @param source - Identifier of the module that registered the bad
   *   entry (usually the class name).
   */
  public constructor(
    public readonly field: string,
    public readonly reason: string,
    public readonly source: string,
  ) {
    super(`Invalid publishable entry from ${source}: field "${field}" — ${reason}.`);
    this.name = "InvalidPublishableEntryError";
  }
}
