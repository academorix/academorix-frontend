/**
 * @file host.command.ts
 * @module @stackra/routing/console/commands
 * @description The `stackra host` command — manage `/etc/hosts` entries for
 *   local subdomain testing.
 *
 *   Idempotent — writes the entries between BEGIN / END markers so re-running
 *   the command replaces the block cleanly instead of appending duplicates.
 *   Requires elevated permissions to touch `/etc/hosts` — the command fails
 *   soft with a friendly hint when the write throws `EACCES`.
 *
 *   Auto-discovered by `@stackra/console`'s `CommandLoader` at bootstrap when
 *   `RoutingConsoleModule` is imported by the CLI's root module.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { BaseCommand, Command } from "@stackra/console";
import { Env } from "@stackra/support";

import { HOSTS_PATH } from "../constants";
import type { IHostOptions } from "../interfaces";
import { computeHostDiff, renderHostBlock } from "../utils";

/**
 * Manage `/etc/hosts` entries for local subdomain testing.
 *
 * Reads `rootDomain` + `devSubdomains` from `react-router.config.ts` in
 * the current working directory. The `--rootDomain` flag and the
 * `STACKRA_ROOT_DOMAIN` env var both take precedence over the config file.
 *
 * @example
 * ```sh
 * # Write the block (root domain from react-router.config.ts).
 * sudo pnpm stackra host
 *
 * # Print the diff without touching the file.
 * pnpm stackra host --dry-run
 *
 * # Remove the block.
 * sudo pnpm stackra host --remove
 *
 * # Override the root domain from the CLI.
 * sudo pnpm stackra host --rootDomain=academorix.app
 * ```
 */
@Command({
  name: "host",
  description: "Manage /etc/hosts entries for local subdomain testing.",
  options: [
    {
      name: "--remove",
      description: "Remove entries instead of adding.",
      type: "boolean",
    },
    {
      name: "--dry-run",
      description: "Print the diff without writing.",
      type: "boolean",
    },
    {
      name: "--rootDomain",
      description: "Override rootDomain from react-router.config.ts.",
      type: "string",
    },
  ],
})
export class HostCommand extends BaseCommand {
  /**
   * Execute the command. Reads options via `BaseCommand#option(...)`,
   * resolves the root domain, computes the diff, and writes (or bails).
   *
   * @returns `void` on success — the base runner turns that into exit 0.
   */
  public async handle(): Promise<void> {
    const options = this.readOptions();

    // Root-domain resolution: CLI flag → env var → config file.
    const rootDomain =
      options.rootDomain ??
      Env.get("STACKRA_ROOT_DOMAIN") ??
      (await this.readRootDomainFromConfig());

    if (!rootDomain) {
      // Fail-loud — the command has no target without a domain. Name
      // both ways to supply one so the operator can retry immediately.
      this.output.error(
        "stackra host: rootDomain not set. Pass `--rootDomain <domain>` " +
          "or configure it in react-router.config.ts.",
      );
      return;
    }

    const subdomains = await this.readSubdomainsFromConfig();
    const newBlock = renderHostBlock(rootDomain, subdomains);

    let currentContent = "";
    try {
      currentContent = await fs.readFile(HOSTS_PATH, "utf8");
    } catch (err) {
      // Fail-soft on ENOENT — some minimal containers ship without
      // `/etc/hosts`. Rethrow anything else so the operator sees it.
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
    }

    const diff = computeHostDiff(currentContent, newBlock, options.remove);

    // Print the summary + block preview BEFORE writing — the operator
    // sees exactly what would change even in `--dry-run` mode.
    this.output.info(diff.summary);
    if (!options.remove && diff.changed) {
      this.output.info(newBlock);
    }

    if (!diff.changed || options.dryRun) return;

    try {
      await fs.writeFile(HOSTS_PATH, diff.nextContent, "utf8");
      this.output.success(`Wrote ${HOSTS_PATH}.`);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EACCES" || code === "EPERM") {
        // Fail-soft with a retry hint — a stack trace here would only
        // scare the operator; the message tells them exactly what to
        // do next.
        this.output.error(
          `Cannot write ${HOSTS_PATH} (permission denied). ` +
            `Re-run with elevated privileges: sudo pnpm stackra host`,
        );
        return;
      }
      throw err;
    }
  }

  /**
   * Read the strict options bag from `BaseCommand#option(...)`.
   *
   * The @Command decorator declares three options; `option()` returns
   * `unknown`, so we coerce here into the typed `IHostOptions` shape.
   */
  private readOptions(): IHostOptions {
    return {
      remove: Boolean(this.option<boolean>("remove")),
      dryRun: Boolean(this.option<boolean>("dry-run")),
      rootDomain: this.option<string | undefined>("rootDomain"),
    };
  }

  /**
   * Best-effort read of `rootDomain` from `react-router.config.ts`
   * in the current working directory. Returns `undefined` if the file
   * doesn't exist or the import blows up — the caller has the CLI flag
   * + env var as fall-backs.
   */
  private async readRootDomainFromConfig(): Promise<string | undefined> {
    const configFile = path.resolve(process.cwd(), "react-router.config.ts");
    try {
      const stat = await fs.stat(configFile);
      if (!stat.isFile()) return undefined;
    } catch {
      return undefined;
    }
    try {
      // Dynamic import — Node's loader parses whatever TS/ESM shape is
      // in the file; we only care about the default export's shape.
      const mod = (await import(pathToFileURL(configFile).toString())) as {
        default?: { rootDomain?: string };
      };
      return mod.default?.rootDomain;
    } catch {
      return undefined;
    }
  }

  /**
   * Best-effort read of `devSubdomains` from `react-router.config.ts`.
   * Returns an empty array when the file is missing or the default
   * export doesn't declare `devSubdomains`.
   */
  private async readSubdomainsFromConfig(): Promise<readonly string[]> {
    const configFile = path.resolve(process.cwd(), "react-router.config.ts");
    try {
      const mod = (await import(pathToFileURL(configFile).toString())) as {
        default?: { devSubdomains?: readonly string[] };
      };
      return mod.default?.devSubdomains ?? [];
    } catch {
      return [];
    }
  }
}
