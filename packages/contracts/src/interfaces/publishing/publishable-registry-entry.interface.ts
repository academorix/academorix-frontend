/**
 * @file publishable-registry-entry.interface.ts
 * @module @stackra/contracts/interfaces/publishing
 * @description The shape stored inside the console's `PublishableRegistry` —
 *   the same as `IPublishableEntry` plus a `sourceModule` breadcrumb so
 *   error messages can name the owning module class.
 */

import type { Type } from "../type.interface";

import type { IPublishableEntry } from "./publishable-entry.interface";
import type { IPublishableFile } from "./publishable-file.interface";

/**
 * Registry-side view of a publishable entry — the fully-normalized
 * shape stored inside `PublishableRegistry`.
 *
 * Differences from `IPublishableEntry` (the author-facing shape):
 *  - `packageRoot` is REQUIRED (the consumer either fills it in from
 *    the source module's `PACKAGE_ROOT` static or rejects at register
 *    time).
 *  - `files` is `readonly IPublishableFile[]` — every entry has been
 *    normalized from the `string | IPublishableFile` shorthand form.
 *  - `sourceModule` is added — the module class that registered the
 *    entry (for diagnostics).
 */
export interface IPublishableRegistryEntry extends Omit<
  IPublishableEntry,
  "packageRoot" | "files"
> {
  /**
   * Absolute filesystem path to the package root. Guaranteed non-empty
   * — the consumer either accepts the caller-supplied value, resolves
   * it from the module class's `PACKAGE_ROOT` static, or fails at
   * register time.
   */
  readonly packageRoot: string;

  /**
   * Every file the publishable ships. Post-normalization: `to` is
   * present on every entry (`to ?? from` filled in by the consumer),
   * so downstream code doesn't need to worry about the shorthand form.
   */
  readonly files: readonly IPublishableFile[];

  /**
   * The module class that registered this entry — captured by the
   * consumer at register time. Handy for diagnostics but not required
   * by the actual publish flow.
   */
  readonly sourceModule: Type<unknown> | null;
}
