/**
/**
 * @file console-output.service.ts
 * @module @stackra/console/services
 * @description Enterprise-grade DI-injectable console output service.
 *   Wraps @clack/prompts for interactive prompts, picocolors for styling,
 *   cli-table3 for tables, boxen for styled panels, and terminal-link for
 *   clickable URLs. Supports theming, TTY detection, and non-interactive fallback.
 *
 *   ## Interop `any` disables
 *
 *   This file talks to `@clack/prompts` and `boxen`, both of which ship
 *   loose types that change across minor versions (option shapes are
 *   unstable, some union members are hidden). Rather than pin exact
 *   third-party types (which would break at every dep bump), we cast at
 *   the boundary with `as any` and disable the associated ESLint rules
 *   file-wide. The RUNTIME shapes are validated by our own `ITextOptions`,
 *   `ISelectOption<T>`, etc. — those types are the contract callers see.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-redundant-type-constituents */

import * as p from "@clack/prompts";
import { Injectable } from "@stackra/container";
import boxen from "boxen";
import Table from "cli-table3";
import terminalLink from "terminal-link";

import { CommandCancelledError } from "../errors";

import { getTheme } from "./theme.service";

import type { IConsoleTheme } from "../interfaces/console-theme.interface";
import type {
  IConsoleOutput,
  ITextOptions,
  IConfirmOptions,
  ISelectOption,
  IMultiselectOption,
  ISpinner,
  IProgressOptions,
  IProgressBar,
  ITaskItem,
} from "@stackra/contracts";

/**
 * Enterprise-grade console output service.
 *
 * Provides a rich set of styled terminal output operations:
 * - Interactive prompts (text, confirm, select, multiselect)
 * - Styled messages (info, success, warning, error)
 * - Tables with box-drawing borders
 * - Progress bars and spinners
 * - Sequential task execution with status
 * - Boxed panels for section headers
 * - Clickable terminal links
 * - Key-value pair display
 * - Horizontal separators
 * - JSON/object pretty-printing
 *
 * All output respects the active theme (colors, icons, indentation).
 * In non-TTY environments, output falls back to plain text.
 */
@Injectable()
export class ConsoleOutput implements IConsoleOutput {
  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Get the active theme.
   *
   * @returns The current theme configuration
   */
  private get theme(): IConsoleTheme {
    return getTheme();
  }

  /**
   * Check if the current environment supports interactive prompts.
   *
   * @returns True if stdout is a TTY
   */
  private get isInteractive(): boolean {
    return Boolean(process.stdout.isTTY);
  }

  /**
   * Get the indent string based on theme.
   *
   * @returns Indent whitespace string
   */
  private get indent(): string {
    return " ".repeat(this.theme.indent);
  }

  /**
   * Guard against interactive operations in non-TTY environments.
   *
   * @throws {CommandCancelledError} When running in non-TTY mode
   */
  private requireInteractive(): void {
    if (!this.isInteractive) {
      throw new CommandCancelledError(
        "Interactive prompts are not available in non-TTY environments. " +
          "Provide all required arguments via command-line flags.",
      );
    }
  }

  /**
   * Check if a prompt result indicates cancellation.
   *
   * @param result - The prompt result value
   * @throws {CommandCancelledError} When the user cancelled the prompt
   */
  private checkCancellation(result: unknown): void {
    if (p.isCancel(result)) {
      throw new CommandCancelledError();
    }
  }

  /**
   * Write to stdout with optional theme prefix.
   *
   * @param text - Text to write
   */
  private write(text: string): void {
    const prefix = this.theme.prefix ? `${this.theme.prefix} ` : "";

    process.stdout.write(`${prefix}${text}`);
  }

  /**
   * Write a line to stdout with indent.
   *
   * @param text - Text to write
   */
  private writeln(text: string): void {
    this.write(`${this.indent}${text}\n`);
  }

  /**
   * Format a timestamp for log output.
   *
   * @returns Formatted timestamp string or empty
   */
  private timestamp(): string {
    if (!this.theme.showTimestamp) return "";
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour12: false });

    return this.theme.palette.muted(`[${time}] `);
  }

  // ==========================================================================
  // Display Methods — Intro / Outro
  // ==========================================================================

  /**
   * Display a styled introduction banner.
   *
   * @param title - The title text to display
   */
  public intro(title: string): void {
    if (this.isInteractive) {
      p.intro(this.theme.palette.banner(` ${title} `));
    } else {
      this.write(`\n=== ${title} ===\n\n`);
    }
  }

  /**
   * Display a styled closing message.
   *
   * @param message - The outro text to display
   */
  public outro(message: string): void {
    if (this.isInteractive) {
      p.outro(this.theme.palette.muted(message));
    } else {
      this.write(`\n${message}\n\n`);
    }
  }

  // ==========================================================================
  // Display Methods — Messages
  // ==========================================================================

  /**
   * Display an informational message.
   *
   * @param message - The message text
   */
  public info(message: string): void {
    const { icons, palette } = this.theme;

    if (this.isInteractive) {
      p.log.info(`${this.timestamp()}${palette.info(message)}`);
    } else {
      this.write(`${this.timestamp()}${icons.info} ${message}\n`);
    }
  }

  /**
   * Display a success message.
   *
   * @param message - The message text
   */
  public success(message: string): void {
    const { icons, palette } = this.theme;

    if (this.isInteractive) {
      p.log.success(`${this.timestamp()}${palette.success(message)}`);
    } else {
      this.write(`${this.timestamp()}${icons.success} ${message}\n`);
    }
  }

  /**
   * Display a warning message.
   *
   * @param message - The message text
   */
  public warning(message: string): void {
    const { icons, palette } = this.theme;

    if (this.isInteractive) {
      p.log.warning(`${this.timestamp()}${palette.warning(message)}`);
    } else {
      process.stderr.write(`${this.timestamp()}${icons.warning} ${message}\n`);
    }
  }

  /**
   * Display an error message.
   *
   * @param message - The message text
   */
  public error(message: string): void {
    const { icons, palette } = this.theme;

    if (this.isInteractive) {
      p.log.error(`${this.timestamp()}${palette.error(message)}`);
    } else {
      process.stderr.write(`${this.timestamp()}${icons.error} ${message}\n`);
    }
  }

  // ==========================================================================
  // Display Methods — Enhanced
  // ==========================================================================

  /**
   * Display a step/action message with an arrow prefix.
   *
   * @param message - The step description
   */
  public step(message: string): void {
    const { icons, palette } = this.theme;

    this.writeln(`${palette.primary(icons.arrow)} ${message}`);
  }

  /**
   * Display a key-value pair with styled label.
   *
   * @param key - The label/key
   * @param value - The value to display
   */
  public pair(key: string, value: string): void {
    const { palette } = this.theme;

    this.writeln(`${palette.label(key)}: ${palette.value(value)}`);
  }

  /**
   * Display multiple key-value pairs as an aligned list.
   *
   * @param pairs - Object or Map of key-value entries
   */
  public pairs(pairs: Record<string, string> | [string, string][]): void {
    const entries = Array.isArray(pairs) ? pairs : Object.entries(pairs);
    const maxKeyLen = entries.reduce((max, [k]) => Math.max(max, k.length), 0);

    const { palette } = this.theme;

    for (const [key, value] of entries) {
      this.writeln(`${palette.label(key.padEnd(maxKeyLen))}  ${palette.value(value)}`);
    }
  }

  /**
   * Display a boxed panel with a title and body text.
   * Uses the boxen package for styled boxes in TTY mode.
   *
   * @param title - Panel title
   * @param body - Body text (supports multi-line)
   * @param options - Optional boxen style overrides
   */
  public box(
    title: string,
    body: string,
    options?: { borderColor?: string; padding?: number },
  ): void {
    if (!this.isInteractive || !this.theme.useBoxes) {
      this.write(`\n--- ${title} ---\n${body}\n---\n\n`);

      return;
    }

    const output = boxen(body, {
      title,
      titleAlignment: "left",
      padding: options?.padding ?? 1,
      margin: { top: 1, bottom: 1, left: 1, right: 0 },
      borderColor: (options?.borderColor as any) ?? "cyan",
      borderStyle: "round",
    });

    this.write(`${output}\n`);
  }

  /**
   * Display a clickable terminal link (falls back to URL text in unsupported terminals).
   *
   * @param text - Display text
   * @param url - URL to link to
   */
  public link(text: string, url: string): void {
    const { palette } = this.theme;
    const linked = terminalLink(text, url, { fallback: (t, u) => `${t} (${palette.url(u)})` });

    this.writeln(palette.url(linked));
  }

  /**
   * Display a horizontal separator line.
   *
   * @param width - Width in characters (default: 60)
   * @param label - Optional centered label
   */
  public separator(width = 60, label?: string): void {
    const { icons, palette } = this.theme;
    const line = icons.line.repeat(width);

    if (label) {
      const padLen = Math.max(0, Math.floor((width - label.length - 2) / 2));
      const leftPad = icons.line.repeat(padLen);
      const rightPad = icons.line.repeat(width - padLen - label.length - 2);

      this.writeln(palette.border(`${leftPad} ${palette.label(label)} ${rightPad}`));
    } else {
      this.writeln(palette.border(line));
    }
  }

  /**
   * Display an object or JSON value with syntax-highlighted formatting.
   *
   * @param data - Object to display
   * @param label - Optional label shown above
   */
  public json(data: unknown, label?: string): void {
    const { palette } = this.theme;

    if (label) {
      this.writeln(palette.label(label));
    }

    const formatted = JSON.stringify(data, null, 2);
    // `String.prototype.replace`'s callback signature uses `any[]` for
    // captures — annotate `string` explicitly so the palette calls
    // stay type-safe.
    const highlighted = formatted
      .replace(/"([^"]+)":/g, (_: string, key: string) => `${palette.primary(`"${key}"`)}:`)
      .replace(/: "([^"]+)"/g, (_: string, val: string) => `: ${palette.success(`"${val}"`)}`)
      .replace(/: (\d+)/g, (_: string, num: string) => `: ${palette.warning(num)}`)
      .replace(/: (true|false)/g, (_: string, bool: string) => `: ${palette.info(bool)}`)
      .replace(/: (null)/g, (_: string, n: string) => `: ${palette.muted(n)}`);

    for (const line of highlighted.split("\n")) {
      this.writeln(`  ${line}`);
    }
    this.write("\n");
  }

  /**
   * Display a bulleted list.
   *
   * @param items - Array of list items
   * @param options - List style (bullet, pointer, numbered)
   */
  public list(items: string[], options?: { style?: "bullet" | "pointer" | "numbered" }): void {
    const { icons, palette } = this.theme;
    const style = options?.style ?? "bullet";

    items.forEach((item, index) => {
      let prefix: string;

      switch (style) {
        case "pointer":
          prefix = palette.primary(icons.pointer);
          break;
        case "numbered":
          prefix = palette.muted(`${(index + 1).toString().padStart(2)}.`);
          break;
        default:
          prefix = palette.muted(icons.bullet);
      }
      this.writeln(`${prefix} ${item}`);
    });
  }

  // ==========================================================================
  // Tables
  // ==========================================================================

  /**
   * Render a formatted table using cli-table3 with theme-aware styling.
   *
   * @param headers - Column header labels
   * @param rows - Array of row data (each row is a string array)
   */
  public table(headers: string[], rows: string[][]): void {
    const { palette } = this.theme;

    const table = new Table({
      head: this.isInteractive ? headers.map((h) => palette.accent(h)) : headers,
      style: { head: [], border: [] },
      chars: {
        top: "─",
        "top-mid": "┬",
        "top-left": "┌",
        "top-right": "┐",
        bottom: "─",
        "bottom-mid": "┴",
        "bottom-left": "└",
        "bottom-right": "┘",
        left: "│",
        "left-mid": "├",
        mid: "─",
        "mid-mid": "┼",
        right: "│",
        "right-mid": "┤",
        middle: "│",
      },
    });

    for (const row of rows) {
      table.push(row);
    }

    this.write(`\n${table.toString()}\n\n`);
  }

  // ==========================================================================
  // Layout
  // ==========================================================================

  /**
   * Output one or more blank lines.
   *
   * @param count - Number of blank lines (default: 1)
   */
  public newLine(count = 1): void {
    process.stdout.write("\n".repeat(count));
  }

  // ==========================================================================
  // Interactive Methods
  // ==========================================================================

  /**
   * Prompt the user for text input.
   *
   * @param message - The prompt message
   * @param options - Optional configuration
   * @returns The entered string
   * @throws {CommandCancelledError} When cancelled or in non-TTY mode
   */
  public async text(message: string, options?: ITextOptions): Promise<string> {
    this.requireInteractive();

    const result = await p.text({
      message,
      placeholder: options?.placeholder,
      defaultValue: options?.defaultValue,
      validate: options?.validate as any,
    });

    this.checkCancellation(result);

    return result as string;
  }

  /**
   * Prompt the user for yes/no confirmation.
   *
   * @param message - The confirmation message
   * @param options - Optional configuration
   * @returns True for yes, false for no
   * @throws {CommandCancelledError} When cancelled or in non-TTY mode
   */
  public async confirm(message: string, options?: IConfirmOptions): Promise<boolean> {
    this.requireInteractive();

    const result = await p.confirm({
      message,
      initialValue: options?.initialValue ?? true,
    });

    this.checkCancellation(result);

    return result as boolean;
  }

  /**
   * Present a single-select list of choices.
   *
   * @param message - The prompt message
   * @param options - Array of selectable options
   * @returns The selected option's value
   * @throws {CommandCancelledError} When cancelled or in non-TTY mode
   */
  public async select<T>(message: string, options: ISelectOption<T>[]): Promise<T> {
    this.requireInteractive();

    const result = await p.select({
      message,
      options: options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        ...(opt.hint ? { hint: opt.hint } : {}),
      })) as any,
    });

    this.checkCancellation(result);

    return result as T;
  }

  /**
   * Present a multi-select list of choices.
   *
   * @param message - The prompt message
   * @param options - Array of selectable options
   * @returns Array of selected option values
   * @throws {CommandCancelledError} When cancelled or in non-TTY mode
   */
  public async multiselect<T>(message: string, options: IMultiselectOption<T>[]): Promise<T[]> {
    this.requireInteractive();

    const result = await p.multiselect({
      message,
      options: options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        ...(opt.hint ? { hint: opt.hint } : {}),
      })) as any,
      initialValues: options.filter((o) => o.initialSelected).map((o) => o.value) as any,
    });

    this.checkCancellation(result);

    return result as T[];
  }

  /**
   * Prompt for a password (hidden input).
   *
   * @param message - The prompt message
   * @returns The entered password
   * @throws {CommandCancelledError} When cancelled or in non-TTY mode
   */
  public async password(message: string): Promise<string> {
    this.requireInteractive();

    const result = await (p as any).password({ message });

    this.checkCancellation(result);

    return result as string;
  }

  // ==========================================================================
  // Progress & Tasks
  // ==========================================================================

  /**
   * Create a spinner for long-running operations.
   *
   * @returns A spinner instance with start/stop methods
   */
  public spinner(): ISpinner {
    const { icons } = this.theme;

    if (!this.isInteractive) {
      return {
        start(message: string): void {
          process.stdout.write(`${icons.active} ${message}\n`);
        },
        stop(message?: string): void {
          if (message) {
            process.stdout.write(`${icons.success} ${message}\n`);
          }
        },
      };
    }

    const s = p.spinner();

    return {
      start(message: string): void {
        s.start(message);
      },
      stop(message?: string, _exitCode?: number): void {
        s.stop(message);
      },
    };
  }

  /**
   * Create a progress bar for tracking completion.
   *
   * @param options - Progress bar configuration (total steps, message)
   * @returns A progress bar instance with increment/finish methods
   */
  public progress(options: IProgressOptions): IProgressBar {
    const { palette, icons } = this.theme;
    let current = 0;
    const { total, message } = options;

    const barWidth = 40;

    const render = (): void => {
      if (!this.isInteractive) return;

      const percent = Math.min(100, Math.round((current / total) * 100));
      const filled = Math.round((percent / 100) * barWidth);
      const empty = barWidth - filled;
      const bar = "█".repeat(filled) + "░".repeat(empty);
      const text = message ? `${message} ` : "";

      process.stdout.write(
        `\r${this.indent}${text}${palette.primary(bar)} ${palette.highlight(`${percent}%`)}`,
      );
    };

    render();

    return {
      increment(step = 1): void {
        current = Math.min(current + step, total);
        render();
      },
      finish(finishMessage?: string): void {
        current = total;
        render();
        process.stdout.write("\n");
        if (finishMessage) {
          if (process.stdout.isTTY) {
            p.log.success(palette.success(finishMessage));
          } else {
            process.stdout.write(`${icons.success} ${finishMessage}\n`);
          }
        }
      },
    };
  }

  /**
   * Execute an array of named tasks sequentially with status display.
   *
   * @param items - Array of task definitions to execute
   * @returns Resolves when all tasks complete
   */
  public async tasks(items: ITaskItem[]): Promise<void> {
    const { icons } = this.theme;

    for (const item of items) {
      if (item.enabled === false) {
        this.info(`${icons.skip} Skipped: ${item.title}`);
        continue;
      }

      const s = this.spinner();

      s.start(item.title);

      try {
        await item.task((msg: string) => {
          s.stop(msg, 0);
          s.start(msg);
        });
        s.stop(`${item.title}`, 0);
      } catch (error: Error | any) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        s.stop(`${item.title} ${this.theme.palette.error(`— ${errorMessage}`)}`, 1);
        throw error;
      }
    }
  }
}
