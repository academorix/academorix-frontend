/**
 * @file command.decorator.ts
 * @module @stackra/console/decorators
 * @description Class decorator that registers a class as a console command.
 *   Stores command metadata via `@vivtel/metadata` for auto-discovery by
 *   the CommandLoader during the OnModuleInit lifecycle hook.
 */

import { Injectable } from "@stackra/container";
import { defineMetadata } from "@vivtel/metadata";

import { COMMAND_METADATA_KEY } from "../constants";
import { COMMAND_NAME_PATTERN } from "../constants";
import { InvalidCommandNameError } from "../errors";

import type { ICommandMetadata } from "../interfaces";

/**
 * Register a class as a console command.
 *
 * The decorated class must extend `BaseCommand` and implement the
 * `handle()` method. The CommandLoader will auto-discover this class
 * during bootstrap and register it in the CommandRegistry.
 *
 * @param metadata - Command metadata (name, description, arguments, options)
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Command({
 *   name: 'config:publish',
 *   description: 'Publish a package config file to the application config directory',
 *   arguments: [{ name: 'package', description: 'Package name', required: true }],
 *   options: [{ name: '--force', short: '-f', description: 'Overwrite without prompt', type: 'boolean' }],
 * })
 * @Injectable()
 * export class ConfigPublishCommand extends BaseCommand {
 *   public async handle(): Promise<void> { ... }
 * }
 * ```
 */
export function Command(metadata: ICommandMetadata): ClassDecorator {
  // Validate command name at decoration time
  if (!COMMAND_NAME_PATTERN.test(metadata.name)) {
    throw new InvalidCommandNameError(metadata.name);
  }

  // TypeScript's built-in `ClassDecorator` type signature is
  // `<T extends Function>(target: T) => T | void` — `Function` is
  // mandated by the language decorator contract; our body only calls
  // `Injectable()` (which also takes `Function`) and `defineMetadata`
  // (which stores an arbitrary object).
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (target: Function) => {
    Injectable()(target);
    defineMetadata(COMMAND_METADATA_KEY, metadata, target);
  };
}
