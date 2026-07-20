/**
 * @file command-testing-module-options.interface.ts
 * @module @stackra/console/interfaces
 * @description Options accepted by `createCommandTestingModule(...)` — the
 *   testing helper for exercising commands in isolation. Every field is
 *   optional; callers supply only what their test needs.
 */

import type { TestConsoleOutput } from "../testing/test-console-output";
import type { Type, Provider } from "@stackra/container";

/**
 * Options bag for `createCommandTestingModule(...)`.
 */
export interface ICommandTestingModuleOptions {
  /**
   * Command classes to include as providers. The test helper does NOT
   * register these with the mock discovery service — call
   * `context.get(YourCommand)` directly to instantiate them.
   */
  readonly commands?: readonly Type<unknown>[];

  /**
   * Extra providers to add to the test container. Use this to override the
   * default mock `DISCOVERY_SERVICE`, to inject a specific `CommandRegistry`,
   * or to supply domain-specific services the command under test depends
   * on.
   */
  readonly providers?: readonly Provider[];

  /**
   * A pre-configured `TestConsoleOutput` instance. Supply your own when
   * multiple tests share the same recorder or when you've already primed
   * it with `setResponses(...)` for interactive prompts.
   *
   * When omitted, the helper constructs a fresh `TestConsoleOutput`.
   */
  readonly output?: TestConsoleOutput;
}
