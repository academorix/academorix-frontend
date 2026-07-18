/**
 * @file console-module-options.interface.ts
 * @module @stackra/console/interfaces
 * @description Configuration interface for the ConsoleModule.
 *   Defines all available options for configuring the CLI framework.
 */

/**
 * Console module configuration options.
 *
 * Passed to `ConsoleModule.forRoot()` to configure the CLI framework.
 * All fields are optional — defaults are applied for omitted values.
 */
export interface IConsoleModuleOptions {
  /** Binary name displayed in help output. Default: 'stackra' */
  binaryName?: string;

  /** Glob pattern for command discovery. Default: 'src/commands/' */
  commandsDirectory?: string;

  /** Enable verbose error output (stack traces). Default: false */
  verbose?: boolean;

  /** Additional paths to scan for commands. */
  commandPaths?: string[];
}

/**
 * Async configuration options for `ConsoleModule.forRootAsync()`.
 *
 * Supports factory-based configuration resolution from other providers.
 */
export interface IConsoleModuleAsyncOptions {
  /**
   * Factory function that returns the module options.
   *
   * @param args - Injected dependencies
   * @returns The console module options (sync or async)
   */
  useFactory: (...args: unknown[]) => IConsoleModuleOptions | Promise<IConsoleModuleOptions>;

  /** DI tokens to inject into the factory function. */
  inject?: any[];
}
