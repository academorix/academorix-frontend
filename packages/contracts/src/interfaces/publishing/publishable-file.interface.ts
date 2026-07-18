/**
 * @file publishable-file.interface.ts
 * @module @stackra/contracts/interfaces/publishing
 * @description A single (source, destination) pair inside a publishable
 *   entry. Multiple files can ship under one tag — e.g. a stubs
 *   publishable exposes every `.ejs` under `stubs/` in one shot.
 */

/**
 * A single file the publisher will materialize from a package's source
 * tree into the app's working directory.
 *
 * Path conventions:
 *  - `from` is relative to the publishable's `packageRoot`. Absolute paths
 *    are rejected at register time so packages can't accidentally publish
 *    files from outside their own tree.
 *  - `to` is relative to `process.cwd()` at the time the command runs.
 *    Absolute paths are allowed but discouraged — the app decides where
 *    files should land, not the framework.
 *  - Files ending in `.ejs` are rendered through the console's stub
 *    renderer before write; every other extension is copied byte-for-byte.
 *    Override with the explicit `render` flag when needed.
 */
export interface IPublishableFile {
  /** Source path relative to the publishable's `packageRoot`. */
  readonly from: string;

  /**
   * Destination path relative to `process.cwd()`.
   *
   * When omitted, defaults to `from` — the destination mirrors the
   * source path exactly (a file at `config/queue.config.ts` in the
   * package lands at `config/queue.config.ts` in the consumer app).
   *
   * Only set explicitly when the destination needs to diverge from the
   * source (rare — e.g. relocating a stub into `app/stubs/` when the
   * app-side convention is different from the package's).
   */
  readonly to?: string;

  /**
   * Force-toggle template rendering.
   *
   * When omitted, the publisher renders `.ejs` files through the console's
   * `StubRenderer` and copies every other extension byte-for-byte. Set
   * `true` to render a non-`.ejs` file; set `false` to copy a `.ejs` file
   * verbatim without template evaluation.
   */
  readonly render?: boolean;
}
