/**
 * @file index.ts
 * @module @stackra/console/errors
 * @description Barrel export for console error classes.
 */

export { ConsoleError } from "./console.error";
export { CommandCancelledError } from "./command-cancelled.error";
export { DuplicateCommandError } from "./duplicate-command.error";
export { InvalidCommandNameError } from "./invalid-command-name.error";
export { ModuleAlreadyRegisteredError } from "./module-already-registered.error";
export { MissingArgumentError } from "./missing-argument.error";
export { UnknownCommandError } from "./unknown-command.error";
