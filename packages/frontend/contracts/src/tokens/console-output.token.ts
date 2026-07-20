/**
 * @file console-output.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token that binds a concrete implementation of `IConsoleOutput`
 *   into the container. Consumers inject `@Inject(CONSOLE_OUTPUT)` and depend
 *   on the interface, never on the concrete class from `@stackra/console`.
 */

/**
 * DI token for the console output service.
 *
 * Provided by `ConsoleModule.forRoot(...)` in `@stackra/console`. Consumers
 * (base commands, custom command classes, feature packages that want to
 * emit styled CLI output) inject the token, receive the shared instance,
 * and rely only on the `IConsoleOutput` shape.
 */
export const CONSOLE_OUTPUT = Symbol("CONSOLE_OUTPUT");
