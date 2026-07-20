/**
 * @file host-diff.interface.ts
 * @module @stackra/routing/console/interfaces
 * @description Result of diffing the current `/etc/hosts` content against the
 *   target state produced by `stackra host` — what the caller should write,
 *   and whether anything changed at all.
 */

/**
 * Shape returned by `computeHostDiff(...)`. Consumed by `HostCommand`
 * to decide whether to write, print, or bail.
 */
export interface IHostDiff {
  /** Whether the file needs to change at all. */
  readonly changed: boolean;

  /** The desired hosts-file content — write this to disk. */
  readonly nextContent: string;

  /** Human-readable summary suitable for the CLI output stream. */
  readonly summary: string;
}
