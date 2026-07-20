/**
 * @file index.ts
 * @module @stackra/console
 * @description Public API for the @stackra/console CLI framework package.
 *   Re-exports all public symbols organized by category.
 *
 *   The console package provides the FRAMEWORK layer for CLI commands:
 *   - BaseCommand abstract class
 *   - @Command() decorator for auto-discovery
 *   - ConsoleOutput service (styled terminal interactions)
 *   - CommandRegistry (lookup, namespace grouping, subcommands)
 *   - CommandLoader (DISCOVERY_SERVICE-based auto-registration)
 *   - ASCII art banner utilities
 *   - Testing utilities (via ./testing subpath)
 *
 *   Domain-specific commands live in their owning packages:
 *   - config:publish, config:cache, config:clear → @stackra/modules
 *   - cache:clear, cache:forget → @stackra/cache
 *   - queue:work, queue:retry → @stackra/queue
 */

// ============================================================================
// Module
// ============================================================================
export { ConsoleModule } from "./console.module";

// ============================================================================
// Kernel
// ============================================================================
export { ConsoleKernel } from "./kernel";
export type { ICliOptions } from "./kernel";

// ============================================================================
// Base
// ============================================================================
export { BaseCommand } from "./base";

// ============================================================================
// Decorators
// ============================================================================
export { Command } from "./decorators";

// ============================================================================
// Services
// ============================================================================
export { ConsoleOutput, StubRenderer } from "./services";

// ============================================================================
// Theming
// ============================================================================
export {
  getTheme,
  setTheme,
  resetTheme,
  DEFAULT_THEME,
  DEFAULT_PALETTE,
  DEFAULT_ICONS,
  MINIMAL_THEME,
  VIBRANT_THEME,
} from "./services";
export type {
  IConsoleTheme,
  IConsolePalette,
  IConsoleIcons,
  ColorFn,
  IStubRenderOptions,
  IStubRenderResult,
} from "./interfaces";

// ============================================================================
// Registries
// ============================================================================
export { CommandRegistry } from "./registries";

// ============================================================================
// Errors
// ============================================================================
export {
  ConsoleError,
  CommandCancelledError,
  DuplicateCommandError,
  InvalidCommandNameError,
  ModuleAlreadyRegisteredError,
  MissingArgumentError,
  UnknownCommandError,
} from "./errors";

// ============================================================================
// Interfaces
// ============================================================================
export type {
  IConsoleModuleOptions,
  IConsoleModuleAsyncOptions,
  ICommandMetadata,
  IArgumentDefinition,
  IOptionDefinition,
  IRegisteredCommand,
} from "./interfaces";

// ============================================================================
// Constants
// ============================================================================
export { COMMAND_METADATA_KEY, COMMAND_SOURCE_KEY } from "./constants";
export { COMMAND_NAME_PATTERN } from "./constants";

// ============================================================================
// Utilities
// ============================================================================
export { fuzzyMatch, renderBanner, renderCompactBanner, parseArgv } from "./utils";
export type { IBannerOptions, ParsedArgv } from "./interfaces";

// ============================================================================
// Publishing (vendor:publish + module-level configurePublishables hook)
// ============================================================================
// NOTE: publishing INTERFACES (IHasPublishables, IPublishableConsumer,
// IPublishableEntry, IPublishableFile, IPublishableRegistryEntry) live in
// `@stackra/contracts/interfaces/publishing` per
// `.kiro/steering/contract-reexports.md` — feature packages never re-export
// contracts, so consumers must import those types from `@stackra/contracts`
// directly. Only the RUNTIME pieces (registry, loader, consumer, errors)
// belong on this barrel.
export {
  DuplicatePublishableTagError,
  InvalidPublishableEntryError,
  PublishableConsumer,
  PublishableLoader,
  PublishableRegistry,
} from "./publishing";
