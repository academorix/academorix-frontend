/**
 * @file command-testing-module.ts
 * @module @stackra/console/testing
 * @description Helper for bootstrapping a minimal @stackra/container
 *   application with the console framework wiring plus test doubles for
 *   `IConsoleOutput` and `IDiscoveryService`. Consumers under test call
 *   `createCommandTestingModule({ commands: [...] })`, receive a compiled
 *   container + the test-double output recorder, and can drive commands
 *   through their normal DI graph without touching stdout.
 */

import { Module, ApplicationFactory } from "@stackra/container";
import type { ApplicationContext } from "@stackra/container";
import { CONSOLE_CONFIG, CONSOLE_OUTPUT, DISCOVERY_SERVICE } from "@stackra/contracts";

import { DEFAULT_BINARY_NAME, DEFAULT_COMMANDS_DIRECTORY, DEFAULT_VERBOSE } from "../constants";
import type { ICommandTestingModuleOptions } from "../interfaces";
import { CommandRegistry } from "../registries";
import { CommandLoader } from "../services/command-loader.service";

import { TestConsoleOutput } from "./test-console-output";

/**
 * The shape returned by `createCommandTestingModule(...)`.
 */
export interface ICommandTestingResult {
  /** The compiled application context — call `.get(TokenOrClass)` to resolve. */
  readonly context: ApplicationContext;
  /** The test-double console output — assert against its recorded calls. */
  readonly output: TestConsoleOutput;
  /** The command registry — inspect the commands that got registered. */
  readonly registry: CommandRegistry;
}

/**
 * Bootstrap a minimal test container with the console framework wiring.
 *
 * Provides test doubles for `IConsoleOutput` (defaults to
 * `TestConsoleOutput`) and `IDiscoveryService` (returns an empty provider
 * list unless the caller supplies commands via `options.commands`).
 *
 * @param options - Testing module options (`commands`, `providers`,
 *   optional `output` double to inject).
 * @returns The compiled context + shortcut handles.
 *
 * @example
 * ```typescript
 * const { context, output } = await createCommandTestingModule({
 *   commands: [MyCacheCommand],
 * });
 *
 * const command = context.get(MyCacheCommand);
 * await command.run({}, { force: true });
 *
 * output.assertSuccessCalled("Cache cleared");
 * ```
 */
export async function createCommandTestingModule(
  options: ICommandTestingModuleOptions = {},
): Promise<ICommandTestingResult> {
  const output = options.output ?? new TestConsoleOutput();
  const registry = new CommandRegistry();

  // Mock discovery service — returns no providers by default; consumers who
  // need auto-discovery-driven behaviour override this via `options.providers`
  // with a full DISCOVERY_SERVICE replacement.
  const mockDiscovery = {
    getProviders: () => [],
    getProvidersByMetadata: () => [],
  };

  // Assemble a single ad-hoc module that carries every provider the
  // console framework needs plus whatever the caller wants under test.
  @Module({
    providers: [
      {
        provide: CONSOLE_CONFIG,
        useValue: {
          binaryName: DEFAULT_BINARY_NAME,
          commandsDirectory: DEFAULT_COMMANDS_DIRECTORY,
          verbose: DEFAULT_VERBOSE,
          commandPaths: [],
        },
      },
      { provide: CONSOLE_OUTPUT, useValue: output },
      { provide: DISCOVERY_SERVICE, useValue: mockDiscovery },
      { provide: CommandRegistry, useValue: registry },
      CommandLoader,
      ...(options.commands ?? []),
      ...(options.providers ?? []),
    ],
  })
  class TestingModule {}

  const context = await ApplicationFactory.create(TestingModule);

  return { context, output, registry };
}
