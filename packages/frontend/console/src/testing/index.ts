/**
 * @file index.ts
 * @module @stackra/console/testing
 * @description Barrel export for console testing utilities.
 */

export { TestConsoleOutput } from "./test-console-output";
export { createCommandTestingModule } from "./command-testing-module";
export type { ICommandTestingResult } from "./command-testing-module";
export type { ICommandTestingModuleOptions, IOutputCall } from "../interfaces";
