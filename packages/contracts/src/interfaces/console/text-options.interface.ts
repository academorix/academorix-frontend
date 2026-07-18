/**
 * @file text-options.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Options bag for `IConsoleOutput#text(...)` — the free-form
 *   text prompt.
 */

/**
 * Options accepted by the text prompt. All fields are optional; the
 * concrete implementation supplies its own defaults (placeholder-less
 * input, no default value, no validation) when a key is absent.
 */
export interface ITextOptions {
  /** Placeholder shown inside the input before the user types. */
  readonly placeholder?: string;

  /** Default value used when the user submits an empty response. */
  readonly defaultValue?: string;

  /**
   * Synchronous validator — return a string (the error to display) to
   * reject the input, or `undefined` to accept it.
   */
  readonly validate?: (value: string) => string | undefined;
}
