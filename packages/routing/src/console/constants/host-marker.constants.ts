/**
 * @file host-marker.constants.ts
 * @module @stackra/routing/console/constants
 * @description Markers wrapping the block that `stackra host` writes into
 *   `/etc/hosts` — used to detect + replace an existing block idempotently.
 *
 *   Kept as constants (not template strings) so `String#indexOf` finds them
 *   verbatim on every rerun regardless of the surrounding content.
 */

/** Marks the start of the block managed by `stackra host`. */
export const HOST_BLOCK_BEGIN = "# BEGIN Stackra dev-hosts";

/** Marks the end of the block managed by `stackra host`. */
export const HOST_BLOCK_END = "# END Stackra dev-hosts";

/** Absolute path to the hosts file on Unix-like systems. */
export const HOSTS_PATH = "/etc/hosts";
