/**
 * @file routing-console.module.ts
 * @module @stackra/routing/console
 * @description DI module that registers every routing-owned console command
 *   (`host`, future: `route:list`, `route:matrix`, ...) as providers so
 *   `@stackra/console`'s `CommandLoader` can discover them at bootstrap.
 *
 *   Imported by the CLI's root module, NEVER by the SPA — the SPA has no
 *   business paying for `node:fs` at runtime, so this subpath stays tree-
 *   shakable via the `./console` export.
 *
 * @example
 * ```typescript
 * // apps/cli/src/cli.module.ts
 * import { Module } from '@stackra/container';
 * import { ConsoleModule } from '@stackra/console';
 * import { RoutingConsoleModule } from '@stackra/routing/console';
 *
 * @Module({
 *   imports: [
 *     ConsoleModule.forRoot({ binaryName: 'stackra' }),
 *     RoutingConsoleModule,
 *   ],
 * })
 * export class CliModule {}
 * ```
 */

import { Module } from "@stackra/container";

import { HostCommand } from "./commands";

/**
 * DI module for every command owned by `@stackra/routing`.
 *
 * Providers are picked up automatically by `@stackra/console`'s
 * `CommandLoader` via the `@Command()` metadata key — no manual
 * registration in `@Command()`-consuming code.
 */
@Module({
  providers: [HostCommand],
  exports: [HostCommand],
})
export class RoutingConsoleModule {}
