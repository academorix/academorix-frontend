/**
 * @file confirm-options.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Options bag for `IConsoleOutput#confirm(...)` — the yes/no
 *   confirmation prompt.
 */

/**
 * Options accepted by the confirm prompt.
 */
export interface IConfirmOptions {
  /**
   * The value the prompt starts on. `true` puts the cursor on "Yes",
   * `false` on "No". Defaults to `true` when omitted at the call site.
   */
  readonly initialValue?: boolean;
}
