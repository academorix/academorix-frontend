/**
 * @file console-kernel.ts
 * @module @stackra/console/kernel
 * @description The console kernel — boots @stackra/container headlessly, discovers commands,
 *   parses argv, dispatches the matched command, and exits with appropriate code.
 *   Replaces nest-commander entirely.
 */

import { CommandRegistry } from "../registries/command.registry";
import { ConsoleOutput } from "../services/console-output.service";
import { parseArgv } from "../utils/argv-parser.util";

import type { ICliOptions } from "../interfaces";
import type { ApplicationContext, Type } from "@stackra/container";

// ============================================================================
// Types
// ============================================================================

/**
 * Runtime shape of a `@Command`-decorated class instance. `setOutput` is
 * optional because the base command declares it as such — some subclasses
 * choose not to override.
 */
interface ICommandInstance {
  run(args: unknown, options: Record<string, unknown>): Promise<number | void> | number | void;
  setOutput?(output: ConsoleOutput): void;
}

/**
 * Narrow an unknown thrown value to something that exposes `.message`
 * and (optionally) `.stack`. Errors thrown across async boundaries
 * arrive as `unknown` — this helper preserves the useful fields.
 */
function toErrorLike(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack ?? undefined };
  }
  return { message: String(err) };
}

// ============================================================================
// Kernel
// ============================================================================

/**
 * Console kernel — the entry point for CLI mode execution.
 *
 * Lifecycle:
 * 1. Boot @stackra/container application context (headless, no HTTP)
 * 2. CommandLoader discovers all @Command() providers (via onModuleInit)
 * 3. Parse process.argv → match against CommandRegistry
 * 4. Resolve command instance from DI container
 * 5. Execute command.run(args, options)
 * 6. Close app context + exit with return code
 *
 * @example
 * ```typescript
 * // In cli.ts:
 * import { ConsoleKernel } from '@stackra/console';
 * import { AppModule } from './app.module';
 *
 * ConsoleKernel.run(AppModule);
 * ```
 */
export class ConsoleKernel {
  /**
   * Full CLI lifecycle: boot → parse → dispatch → exit.
   *
   * @param module - The root @stackra/container module class
   * @param options - CLI options (log levels, hooks)
   */
  public static async run(module: Type<unknown>, options: ICliOptions = {}): Promise<never> {
    // Lazy import ApplicationFactory to avoid pulling @stackra/container into non-CLI contexts
    const { ApplicationFactory } = await import("@stackra/container");

    // NOTE: `options.logLevels` is intentionally unused right now — the
    // current `ApplicationFactory.create(module)` signature doesn't accept a
    // logger option. When the container adds one, thread it through here.
    void options.logLevels;

    let app: ApplicationContext;

    try {
      app = await ApplicationFactory.create(module);
    } catch (error: unknown) {
      const { message } = toErrorLike(error);
      process.stderr.write(`\n  Bootstrap failed: ${message}\n\n`);
      process.exit(1);
    }

    // Run beforeBoot hook if provided
    if (options.beforeBoot) {
      await options.beforeBoot(app);
    }

    const exitCode = await ConsoleKernel.boot(app);

    // Fail-soft close — swallow shutdown errors so the process exits cleanly.
    await app.close().catch((closeErr: unknown) => {
      void closeErr;
    });
    process.exit(exitCode);
  }

  /**
   * Execute a command from an already-booted application context.
   *
   * Useful when you've already created the app (e.g., in tests or custom bootstrap).
   *
   * @param app - Booted @stackra/container application context
   * @returns Exit code (0 = success)
   */
  public static async boot(app: ApplicationContext): Promise<number> {
    const registry = app.get(CommandRegistry);

    let output: ConsoleOutput;

    try {
      output = app.get(ConsoleOutput);
    } catch {
      output = new ConsoleOutput();
    }

    const parsed = parseArgv(process.argv.slice(2));

    // Handle --version globally
    if (parsed.options.version || parsed.options.V) {
      process.stdout.write("stackra v0.1.0\n");

      return 0;
    }

    // Handle no command or 'list'
    if (!parsed.commandName || parsed.commandName === "list") {
      const listEntry = registry.get("list");

      if (listEntry) {
        const listCommand = app.get(listEntry.classRef) as ICommandInstance;

        if (typeof listCommand.setOutput === "function") {
          listCommand.setOutput(output);
        }

        const result = await listCommand.run({}, parsed.options);
        return typeof result === "number" ? result : 0;
      }
      // Fallback: print available commands
      const all = registry.getAll();

      process.stdout.write("\n  Available commands:\n\n");
      for (const cmd of all) {
        process.stdout.write(`    ${cmd.name.padEnd(30)} ${cmd.description}\n`);
      }
      process.stdout.write("\n");

      return 0;
    }

    // Resolve the command
    const entry = registry.get(parsed.commandName);

    if (!entry) {
      process.stderr.write(`\n  Command "${parsed.commandName}" not found.\n`);
      process.stderr.write(`  Run "stackra list" to see available commands.\n\n`);

      return 1;
    }

    // Get the command instance from DI
    let command: ICommandInstance;

    try {
      command = app.get(entry.classRef) as ICommandInstance;
    } catch (error: unknown) {
      const { message } = toErrorLike(error);
      process.stderr.write(`\n  Failed to resolve command "${parsed.commandName}": ${message}\n\n`);

      return 1;
    }

    // Wire output
    if (typeof command.setOutput === "function") {
      command.setOutput(output);
    }

    // Execute
    try {
      const result = await command.run(parsed.args, parsed.options);

      return typeof result === "number" ? result : 0;
    } catch (error: unknown) {
      const { message, stack } = toErrorLike(error);
      const verbose = parsed.options.verbose ?? parsed.options.v;

      process.stderr.write(`\n  Error: ${message}\n`);
      if (verbose && stack) {
        process.stderr.write(`\n  ${stack}\n`);
      }
      process.stderr.write("\n");

      return 1;
    }
  }
}
