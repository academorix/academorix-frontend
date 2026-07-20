/**
 * @file console-output.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Shape of the console output service every `@stackra/console`
 *   command depends on. Wraps interactive prompts, styled messages, tables,
 *   spinners, progress bars, and layout helpers.
 *
 *   Consumers inject `@Inject(CONSOLE_OUTPUT)` and depend on THIS interface —
 *   never on the concrete `ConsoleOutput` class from `@stackra/console` (that
 *   would drag the CLI dep tree into every consumer).
 */

import type { ITextOptions } from "./text-options.interface";
import type { IConfirmOptions } from "./confirm-options.interface";
import type { ISelectOption } from "./select-option.interface";
import type { IMultiselectOption } from "./multiselect-option.interface";
import type { ISpinner } from "./spinner.interface";
import type { IProgressOptions } from "./progress-options.interface";
import type { IProgressBar } from "./progress-bar.interface";
import type { ITaskItem } from "./task-item.interface";

/**
 * The public contract of the console output service.
 *
 * Every method is documented on the concrete `ConsoleOutput` class in
 * `@stackra/console`; the signatures here are the wire the framework
 * commits to. Adding a method is a minor bump; changing a signature is
 * a major bump.
 */
export interface IConsoleOutput {
  // ── Intro / Outro ──────────────────────────────────────────────
  /** Display a styled introduction banner. */
  intro(title: string): void;
  /** Display a styled closing message. */
  outro(message: string): void;

  // ── Message levels ─────────────────────────────────────────────
  /** Display an informational message. */
  info(message: string): void;
  /** Display a success message. */
  success(message: string): void;
  /** Display a warning message. */
  warning(message: string): void;
  /** Display an error message. */
  error(message: string): void;

  // ── Layout + display ───────────────────────────────────────────
  /** Display a step/action message with an arrow prefix. */
  step(message: string): void;
  /** Display a key-value pair with styled label. */
  pair(key: string, value: string): void;
  /** Display multiple key-value pairs as an aligned list. */
  pairs(pairs: Record<string, string> | [string, string][]): void;
  /** Display a boxed panel with a title and body text. */
  box(title: string, body: string, options?: { borderColor?: string; padding?: number }): void;
  /** Display a clickable terminal link. */
  link(text: string, url: string): void;
  /** Display a horizontal separator line. */
  separator(width?: number, label?: string): void;
  /** Display an object or JSON value with syntax-highlighted formatting. */
  json(data: unknown, label?: string): void;
  /** Display a bulleted / pointer / numbered list. */
  list(items: string[], options?: { style?: "bullet" | "pointer" | "numbered" }): void;
  /** Render a formatted table. */
  table(headers: string[], rows: string[][]): void;
  /** Output one or more blank lines. */
  newLine(count?: number): void;

  // ── Interactive prompts ────────────────────────────────────────
  /** Prompt the user for text input. */
  text(message: string, options?: ITextOptions): Promise<string>;
  /** Prompt the user for yes/no confirmation. */
  confirm(message: string, options?: IConfirmOptions): Promise<boolean>;
  /** Present a single-select list of choices. */
  select<T>(message: string, options: ISelectOption<T>[]): Promise<T>;
  /** Present a multi-select list of choices. */
  multiselect<T>(message: string, options: IMultiselectOption<T>[]): Promise<T[]>;
  /** Prompt for a password (hidden input). */
  password(message: string): Promise<string>;

  // ── Progress + tasks ───────────────────────────────────────────
  /** Create a spinner for long-running operations. */
  spinner(): ISpinner;
  /** Create a progress bar for tracking completion. */
  progress(options: IProgressOptions): IProgressBar;
  /** Execute an array of named tasks sequentially with status display. */
  tasks(items: ITaskItem[]): Promise<void>;
}
