/**
 * @file base-command.ts
 * @module @stackra/console/base
 * @description Abstract base class for all console commands.
 *   Provides access to ConsoleOutput, argument/option retrieval,
 *   and lifecycle hooks. Integrates with nest-commander's execution model.
 */

import { Inject } from "@stackra/container";
import { CONSOLE_OUTPUT } from "@stackra/contracts";
import type { IConsoleOutput } from "@stackra/contracts";
import { MissingArgumentError } from "../errors";

/**
 * Abstract base class for all console commands.
 *
 * Every command in the @stackra ecosystem extends this class and implements
 * the `handle()` method. The base class provides:
 * - Access to styled console output via `this.output`
 * - Argument retrieval via `this.argument(name)`
 * - Option retrieval via `this.option(name)`
 * - Lifecycle hooks: `handle()` (required) and `afterHandle()` (optional)
 *
 * @example
 * ```typescript
 * @Command({ name: 'greet', description: 'Say hello' })
 * @Injectable()
 * export class GreetCommand extends BaseCommand {
 *   public async handle(): Promise<void> {
 *     const name = this.argument('name');
 *     this.output.success(`Hello, ${name}!`);
 *   }
 * }
 * ```
 */
export abstract class BaseCommand {
  /** Parsed positional arguments from the command invocation. */
  private _args: Record<string, unknown> = {};

  /** Parsed named options from the command invocation. */
  private _options: Record<string, unknown> = {};

  /** The fully qualified command name (set by the runner). */
  private _commandName: string = "";

  /**
   * DI-injected console output service for styled terminal interactions.
   * Access in subclasses via `this.output`.
   */
  @Inject(CONSOLE_OUTPUT)
  protected readonly output!: IConsoleOutput;

  /**
   * Execute the command logic.
   *
   * @returns void for success (exit code 0), or a numeric exit code
   */
  public abstract handle(): Promise<void | number>;

  /**
   * Optional lifecycle hook executed after `handle()` completes successfully.
   * Use for cleanup operations, summary output, or post-processing.
   */
  public async afterHandle(): Promise<void> {
    // No-op by default — override in subclasses as needed
  }

  /**
   * Retrieve a parsed positional argument by name.
   *
   * @param name - Argument name as defined in the @Command() metadata
   * @returns The argument value
   * @throws {MissingArgumentError} When a required argument is not provided
   */
  protected argument<T = string>(name: string): T {
    const value = this._args[name];

    if (value === undefined || value === null) {
      throw new MissingArgumentError(name, this._commandName);
    }

    return value as T;
  }

  /**
   * Retrieve a parsed positional argument by name, returning undefined if not present.
   *
   * @param name - Argument name as defined in the @Command() metadata
   * @returns The argument value or undefined
   */
  protected argumentOptional<T = string>(name: string): T | undefined {
    return this._args[name] as T | undefined;
  }

  /**
   * Retrieve a parsed named option by name.
   *
   * @param name - Option name (without the '--' prefix)
   * @returns The option value, or the defined default for missing options
   */
  protected option<T = unknown>(name: string): T {
    return this._options[name] as T;
  }

  /**
   * Internal: Set parsed arguments. Called by the command runner.
   *
   * @param args - Map of argument name → value
   * @internal
   */
  public setArguments(args: Record<string, unknown>): void {
    this._args = args;
  }

  /**
   * Internal: Set parsed options. Called by the command runner.
   *
   * @param options - Map of option name → value
   * @internal
   */
  public setOptions(options: Record<string, unknown>): void {
    this._options = options;
  }

  /**
   * Internal: Set the command name for error messages.
   *
   * @param name - Fully qualified command name
   * @internal
   */
  public setCommandName(name: string): void {
    this._commandName = name;
  }

  /**
   * Execute the full command lifecycle: handle → afterHandle.
   *
   * Called by the binary entry point. Orchestrates the execution sequence
   * and returns the process exit code.
   *
   * @param args - Parsed positional arguments
   * @param options - Parsed named options
   * @returns The process exit code (0 for success)
   * @internal
   */
  public async run(
    args: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<number> {
    this.setArguments(args);
    this.setOptions(options);

    const result = await this.handle();
    await this.afterHandle();

    return typeof result === "number" ? result : 0;
  }
}
