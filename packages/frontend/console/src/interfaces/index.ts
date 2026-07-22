/**
 * @file index.ts
 * @module @stackra/console/interfaces
 * @description Public API barrel for the `interfaces` category — re-exports
 *   every interface owned by `@stackra/console`: command / argument / option
 *   definitions, CLI options, module options, theme + icon + palette
 *   contracts, parsed argv, and stub-render inputs / results.
 */

export * from "./argument-definition.interface";
export * from "./banner-options.interface";
export * from "./cli-options.interface";
export * from "./command-metadata.interface";
export * from "./command-testing-module-options.interface";
export * from "./console-module-options.interface";
export * from "./console-theme.interface";
export * from "./console-icons.interface";
export * from "./console-palette.interface";
export * from "./option-definition.interface";
export * from "./output-call.interface";
export * from "./parsed-argv.interface";
export * from "./registered-command.interface";
export * from "./stub-render-options.interface";
export * from "./stub-render-result.interface";
