/**
 * @file console-config.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token that binds the resolved `IConsoleModuleOptions`
 *   (binary name, commands directory, verbose flag, extra command paths).
 */

/**
 * DI token for the resolved console module configuration.
 *
 * Provided by `ConsoleModule.forRoot(...)` after defaults are merged.
 * Consumers inject `@Inject(CONSOLE_CONFIG)` to read the effective
 * config at runtime (banner name, verbose mode, additional command
 * paths to scan, ...).
 */
export const CONSOLE_CONFIG = Symbol("CONSOLE_CONFIG");
