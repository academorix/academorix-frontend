/**
 * @file defaults.constant.ts
 * @module @stackra/console/constants
 * @description Default configuration values for the console module.
 *   Used when `forRoot()` is called without explicit configuration.
 */

/** Default binary name displayed in help output and version commands. */
export const DEFAULT_BINARY_NAME = "stackra";

/** Default directory pattern for command auto-discovery. */
export const DEFAULT_COMMANDS_DIRECTORY = "src/commands/";

/** Default verbose mode — disabled in production. */
export const DEFAULT_VERBOSE = false;

/**
 * Valid command name pattern: lowercase alphanumeric, colons, and hyphens.
 * Each segment (separated by colons) must start with a letter.
 */
export const COMMAND_NAME_PATTERN = /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)*$/;
