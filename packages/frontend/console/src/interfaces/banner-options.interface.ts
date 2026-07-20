/**
 * @file banner-options.interface.ts
 * @module @stackra/console/interfaces
 * @description Shape of the options bag consumed by `renderBanner(...)` and
 *   `renderCompactBanner(...)` — the ASCII-art startup banner shown by the
 *   CLI's `ConsoleKernel` before dispatching the requested command.
 */

/**
 * A `picocolors`-style colouriser — takes a string, returns the same string
 * wrapped in ANSI escape codes. `pc.cyan`, `pc.green`, etc. satisfy this
 * shape. Kept as a plain function signature so callers can pass their own
 * theming layer without pulling `picocolors` types in.
 */
export type ColorFn = (input: string) => string;

/**
 * Options accepted by both `renderBanner` (5-line ASCII art) and
 * `renderCompactBanner` (single-line fallback for narrow terminals).
 */
export interface IBannerOptions {
  /** Application name — rendered as ASCII art (or bold text in compact mode). */
  readonly name: string;

  /** Optional semver-style version — rendered as a dim `v<version>` badge. */
  readonly version?: string;

  /** Optional environment label — e.g. `"dev"`, `"prod"`, rendered as `[label]`. */
  readonly environment?: string;

  /**
   * Colouriser applied to the banner name. Defaults to `picocolors.cyan`
   * when omitted at the call site.
   */
  readonly color?: ColorFn;
}
