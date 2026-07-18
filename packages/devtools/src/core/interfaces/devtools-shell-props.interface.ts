/**
 * @file devtools-shell-props.interface.ts
 * @module @stackra/devtools/core/interfaces
 * @description Cross-platform props consumed by both the React and
 *   native `<Devtools />` entry components.
 *
 *   The React and native shells accept slightly different shapes at
 *   the edges (React can portal into an explicit target, native uses
 *   a modal Portal by default) — this file captures only the fields
 *   they SHARE so cross-platform consumers can type against one
 *   contract.
 */

/**
 * Cross-platform `<Devtools />` props.
 */
export interface IDevtoolsShellProps {
  /**
   * When explicit, overrides the module-level `enabled` for this
   * mount only. Set to `false` in an SSR route to keep the shell
   * out of the server render even in dev.
   */
  readonly enabled?: boolean;
}
