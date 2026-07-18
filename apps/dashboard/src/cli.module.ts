/**
 * @file cli.module.ts
 * @module @academorix/dashboard/cli.module
 *
 * @description
 * Node-only DI module that wires the `stackra` CLI. The `stackra` bin
 * from `@stackra/console` discovers THIS module (via the `src/cli.module`
 * lookup) instead of the SPA's `app.module.ts` — that keeps the browser
 * bundle free of Node-only CLI code (`node:fs`, `@clack/prompts`, …)
 * while still giving the CLI access to every framework command via
 * discovery.
 *
 * ## What it imports
 *
 *   - `ConsoleModule.forRoot(...)` — the CLI framework itself. Provides
 *     `ConsoleKernel`, `CommandLoader`, and the base command registry.
 *   - `RoutingConsoleModule` — contributes `HostCommand` (`stackra host`).
 *     Every future package that ships a command follows the same
 *     `<Package>ConsoleModule` shape and gets imported here.
 *
 * ## What it does NOT import
 *
 *   - The SPA's `AppModule`. The CLI does not need the routing runtime,
 *     the config namespaces, or any browser-side wiring. Keeping the
 *     graphs disjoint is the whole reason the CLI exists as a separate
 *     module.
 *   - Anything from `src/` that touches `document` / `window` at module
 *     evaluation time — Node has no DOM.
 *
 * ## Usage
 *
 * ```bash
 * # List every discovered command.
 * pnpm stackra list
 *
 * # Preview /etc/hosts changes for the local dev subdomains.
 * pnpm stackra host --rootDomain=academorix.app --dry-run
 *
 * # Write the block (needs sudo — /etc/hosts is root-only).
 * sudo pnpm stackra host --rootDomain=academorix.app
 * ```
 */

import { ConsoleModule } from "@stackra/console";
import { Module } from "@stackra/container";
import { RoutingConsoleModule } from "@stackra/routing/console";

/**
 * Root DI module for the dashboard's CLI.
 *
 * `ConsoleModule.forRoot({ binaryName: "stackra" })` names the binary so
 * every command's help text prints the right invocation prefix. Future
 * package-level console modules land in `imports: [...]` alongside
 * `RoutingConsoleModule`.
 */
@Module({
  imports: [
    ConsoleModule.forRoot({ binaryName: "stackra" }),
    RoutingConsoleModule,
  ],
})
export class CliModule {}
