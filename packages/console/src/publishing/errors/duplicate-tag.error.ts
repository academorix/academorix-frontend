/**
 * @file duplicate-tag.error.ts
 * @module @stackra/console/publishing/errors
 * @description Thrown when two modules try to register a publishable
 *   under the same tag. Fail-loud: silent overwrite would corrupt the
 *   user's files at `vendor:publish` time with no diagnostic.
 */

import { ConsoleError } from "../../errors";

/**
 * Two publishable entries collided on the same `tag`. The workspace
 * enforces globally-unique tags so a `stackra vendor:publish --tag=<x>`
 * unambiguously identifies one entry.
 */
export class DuplicatePublishableTagError extends ConsoleError {
  /**
   * @param tag - The tag that collided.
   * @param firstSource - Human-readable identifier of the module that
   *   registered the tag first (typically the class name).
   * @param secondSource - Same for the module that tried to re-register.
   */
  public constructor(
    public readonly tag: string,
    public readonly firstSource: string,
    public readonly secondSource: string,
  ) {
    super(
      `Publishable tag "${tag}" is already registered by ${firstSource}. ` +
        `${secondSource} attempted to re-register it. ` +
        `Publishable tags MUST be unique across the workspace — ` +
        `rename one of the tags (e.g. "${tag}-v2") and retry.`,
    );
    this.name = "DuplicatePublishableTagError";
  }
}
