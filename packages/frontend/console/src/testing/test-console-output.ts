/**
 * @file test-console-output.ts
 * @module @stackra/console/testing
 * @description Test double for the ConsoleOutput service.
 *   Records all output calls without writing to stdout, provides assertion
 *   methods, and supports pre-programmed responses for interactive prompts.
 */

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
 * Test implementation of IConsoleOutput.
 *
 * Records all output interactions without writing to the terminal.
 * Provides assertion methods for validating command behavior in tests.
 * Supports pre-programmed responses for interactive prompts.
 *
 * @example
 * ```typescript
 * const output = new TestConsoleOutput();
 * output.setResponses({
 *   'confirm:Overwrite?': true,
 *   'text:Enter name:': 'my-command',
 * });
 *
 * // ... execute command ...
 *
 * output.assertSuccessCalled('Config published');
 * output.assertConfirmCalled();
 * ```
 */
import type { IOutputCall } from "../interfaces/output-call.interface";

export class TestConsoleOutput implements IConsoleOutput {
  /** All recorded output calls. */
  private calls: IOutputCall[] = [];

  /** Pre-programmed responses for interactive prompts. */
  private responses: Record<string, unknown> = {};

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Pre-program responses for interactive prompts.
   *
   * Key format: `{method}:{message}` (e.g., 'confirm:Overwrite?', 'text:Enter name:')
   *
   * @param responses - Map of prompt key to response value
   */
  public setResponses(responses: Record<string, unknown>): void {
    this.responses = { ...responses };
  }

  /**
   * Clear all recorded calls.
   */
  public reset(): void {
    this.calls = [];
    this.responses = {};
  }

  /**
   * Get all recorded calls.
   *
   * @returns Array of output call records
   */
  public getCalls(): IOutputCall[] {
    return [...this.calls];
  }

  // ==========================================================================
  // Assertion Methods
  // ==========================================================================

  /**
   * Assert that any output contains the given text.
   *
   * @param text - Text to search for across all recorded outputs
   * @throws Error if the text is not found
   */
  public assertOutputContains(text: string): void {
    const allOutput = this.calls.map((c) => c.args.map(String).join(" ")).join("\n");

    if (!allOutput.includes(text)) {
      throw new Error(
        `Expected output to contain "${text}" but it was not found.\n` +
          `Recorded output:\n${allOutput}`,
      );
    }
  }

  /**
   * Assert that `info()` was called with an optional message match.
   *
   * @param message - Optional substring to match in the info message
   */
  public assertInfoCalled(message?: string): void {
    this.assertMethodCalled("info", message);
  }

  /**
   * Assert that `success()` was called with an optional message match.
   *
   * @param message - Optional substring to match in the success message
   */
  public assertSuccessCalled(message?: string): void {
    this.assertMethodCalled("success", message);
  }

  /**
   * Assert that `error()` was called with an optional message match.
   *
   * @param message - Optional substring to match in the error message
   */
  public assertErrorCalled(message?: string): void {
    this.assertMethodCalled("error", message);
  }

  /**
   * Assert that `warning()` was called with an optional message match.
   *
   * @param message - Optional substring to match in the warning message
   */
  public assertWarningCalled(message?: string): void {
    this.assertMethodCalled("warning", message);
  }

  /**
   * Assert that `confirm()` was called.
   */
  public assertConfirmCalled(): void {
    this.assertMethodCalled("confirm");
  }

  /**
   * Assert that `select()` was called.
   */
  public assertSelectCalled(): void {
    this.assertMethodCalled("select");
  }

  /**
   * Assert that a specific method was called.
   *
   * @param method - Method name
   * @param message - Optional substring to match in the first argument
   */
  private assertMethodCalled(method: string, message?: string): void {
    const methodCalls = this.calls.filter((c) => c.method === method);

    if (methodCalls.length === 0) {
      throw new Error(`Expected "${method}" to be called but it was never invoked.`);
    }

    if (message) {
      const found = methodCalls.some((c) => String(c.args[0]).includes(message));
      if (!found) {
        const actual = methodCalls.map((c) => String(c.args[0])).join(", ");
        throw new Error(
          `Expected "${method}" to be called with message containing "${message}".\n` +
            `Actual calls: ${actual}`,
        );
      }
    }
  }

  // ==========================================================================
  // IConsoleOutput Implementation
  // ==========================================================================

  /**
   * Record an intro call.
   *
   * @param title - The title text
   */
  public intro(title: string): void {
    this.record("intro", [title]);
  }

  /**
   * Record an outro call.
   *
   * @param message - The outro text
   */
  public outro(message: string): void {
    this.record("outro", [message]);
  }

  /**
   * Return pre-programmed text response or empty string.
   *
   * @param message - The prompt message
   * @param _options - Unused in test
   * @returns Pre-programmed response or empty string
   */
  public async text(message: string, _options?: ITextOptions): Promise<string> {
    this.record("text", [message]);
    const key = `text:${message}`;
    return (this.responses[key] as string) ?? "";
  }

  /**
   * Return pre-programmed confirm response or true.
   *
   * @param message - The confirm message
   * @param _options - Unused in test
   * @returns Pre-programmed response or true
   */
  public async confirm(message: string, _options?: IConfirmOptions): Promise<boolean> {
    this.record("confirm", [message]);
    const key = `confirm:${message}`;
    return (this.responses[key] as boolean) ?? true;
  }

  /**
   * Return pre-programmed select response or first option value.
   *
   * @param message - The select message
   * @param options - Available options
   * @returns Pre-programmed response or first option's value
   */
  public async select<T>(message: string, options: ISelectOption<T>[]): Promise<T> {
    this.record("select", [message, options]);
    const key = `select:${message}`;
    return (this.responses[key] as T) ?? options[0]!.value;
  }

  /**
   * Return pre-programmed multiselect response or empty array.
   *
   * @param message - The multiselect message
   * @param options - Available options
   * @returns Pre-programmed response or empty array
   */
  public async multiselect<T>(message: string, options: IMultiselectOption<T>[]): Promise<T[]> {
    this.record("multiselect", [message, options]);
    const key = `multiselect:${message}`;
    return (this.responses[key] as T[]) ?? [];
  }

  /**
   * Return a no-op spinner.
   *
   * @returns A no-op spinner that records start/stop calls
   */
  public spinner(): ISpinner {
    const self = this;
    return {
      start(message: string): void {
        self.record("spinner:start", [message]);
      },
      stop(message?: string): void {
        self.record("spinner:stop", [message]);
      },
    };
  }

  /** Record an info call. */
  public info(message: string): void {
    this.record("info", [message]);
  }

  /** Record a success call. */
  public success(message: string): void {
    this.record("success", [message]);
  }

  /** Record a warning call. */
  public warning(message: string): void {
    this.record("warning", [message]);
  }

  /** Record an error call. */
  public error(message: string): void {
    this.record("error", [message]);
  }

  /** Record a table call. */
  public table(headers: string[], rows: string[][]): void {
    this.record("table", [headers, rows]);
  }

  /** Record a newLine call. */
  public newLine(count?: number): void {
    this.record("newLine", [count]);
  }

  /** Return a no-op progress bar. */
  public progress(options: IProgressOptions): IProgressBar {
    this.record("progress", [options]);
    return {
      increment(): void {},
      finish(): void {},
    };
  }

  /** Execute tasks sequentially without display. */
  public async tasks(items: ITaskItem[]): Promise<void> {
    this.record("tasks", [items]);
    for (const item of items) {
      if (item.enabled === false) continue;
      await item.task(() => {});
    }
  }

  /** Return pre-programmed password response or empty string. */
  public async password(message: string): Promise<string> {
    this.record("password", [message]);
    const key = `password:${message}`;
    return (this.responses[key] as string) ?? "";
  }

  /** Record a step call. */
  public step(message: string): void {
    this.record("step", [message]);
  }

  /** Record a pair call. */
  public pair(key: string, value: string): void {
    this.record("pair", [key, value]);
  }

  /** Record a pairs call. */
  public pairs(pairs: Record<string, string> | [string, string][]): void {
    this.record("pairs", [pairs]);
  }

  /** Record a box call. */
  public box(
    title: string,
    body: string,
    options?: { borderColor?: string; padding?: number },
  ): void {
    this.record("box", [title, body, options]);
  }

  /** Record a link call. */
  public link(text: string, url: string): void {
    this.record("link", [text, url]);
  }

  /** Record a separator call. */
  public separator(width?: number, label?: string): void {
    this.record("separator", [width, label]);
  }

  /** Record a json call. */
  public json(data: unknown, label?: string): void {
    this.record("json", [data, label]);
  }

  /** Record a list call. */
  public list(items: string[], options?: { style?: "bullet" | "pointer" | "numbered" }): void {
    this.record("list", [items, options]);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Record a method call.
   *
   * @param method - Method name
   * @param args - Arguments passed
   */
  private record(method: string, args: unknown[]): void {
    this.calls.push({ method, args, timestamp: new Date() });
  }
}
