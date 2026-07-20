/**
 * @file metadata.constant.ts
 * @module @stackra/console/constants
 * @description Metadata keys used by the @Command() decorator for auto-discovery.
 *   The CommandLoader scans for providers bearing this metadata key during
 *   the OnModuleInit lifecycle hook.
 */

/**
 * Metadata key for the @Command() class decorator.
 *
 * Stored via `@vivtel/metadata`'s `defineMetadata()` on decorated classes.
 * The CommandLoader retrieves all providers with this key during bootstrap.
 */
export const COMMAND_METADATA_KEY = "stackra:console:command";

/**
 * Metadata key for tracking the module that registered a command.
 *
 * Used by the CommandLoader to associate a command with its source package
 * for attribution in help output and diagnostics.
 */
export const COMMAND_SOURCE_KEY = "stackra:console:command:source";
