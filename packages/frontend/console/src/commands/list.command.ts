/**
 * @file list.command.ts
 * @module @stackra/console/commands
 * @description Built-in command that lists all registered commands grouped by
 *   namespace/category. Displays ASCII art banner, then commands organized
 *   with styled namespace headers.
 */

import { Inject } from "@stackra/container";
import { CONSOLE_CONFIG } from "@stackra/contracts";
import { Str } from "@stackra/support";
import pc from "picocolors";

import { BaseCommand } from "../base";
import { Command } from "../decorators";
import { CommandRegistry } from "../registries";
import { renderCompactBanner } from "../utils/ascii-banner.util";

import type { IConsoleModuleOptions } from "../interfaces";

/**
 * List all registered console commands.
 *
 * Renders the ASCII art app banner followed by all commands grouped
 * by namespace (the colon-separated prefix). Each namespace gets a
 * styled header and its commands listed with descriptions.
 *
 * @example
 * ```bash
 * stackra list           # List all commands with banner
 * stackra list config    # Filter to config namespace only
 * ```
 */
@Command({
  name: "list",
  description: "Display a list of all available commands",
  arguments: [{ name: "namespace", description: "Filter commands by namespace", required: false }],
})
export class ListCommand extends BaseCommand {
  /**
   * @param registry - ICommand registry for accessing registered commands
   * @param config - Console module configuration for binary name
   */
  public constructor(
    @Inject(CommandRegistry) private readonly registry: CommandRegistry,
    @Inject(CONSOLE_CONFIG) private readonly config: Required<IConsoleModuleOptions>,
  ) {
    super();
  }

  /**
   * Execute the list command.
   *
   * `handle` is the async CLI contract; even the pure-sync `list` command
   * must return a Promise so `ConsoleKernel.boot` can `await` it uniformly.
   *
   * @returns void (exit code 0)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async handle(): Promise<void> {
    const namespace = this.argumentOptional<string>("namespace");

    // Render ASCII art banner. Route through `Str.upper` per
    // `.kiro/steering/support-utilities.md` instead of `.toUpperCase()`.
    const banner = renderCompactBanner({
      name: Str.upper(this.config.binaryName),
      version: "0.1.0",
    });
    process.stdout.write(banner);
    process.stdout.write("\n");

    if (namespace) {
      this.renderNamespace(namespace);
    } else {
      this.renderAll();
    }

    process.stdout.write("\n");
  }

  /**
   * Render all commands grouped by namespace with styled category headers.
   */
  private renderAll(): void {
    const namespaces = this.registry.getNamespaces();
    const noNamespace = this.registry.getByNamespace("");

    // Top-level commands (no namespace)
    if (noNamespace.length > 0) {
      this.renderCategoryHeader("General");
      for (const cmd of noNamespace) {
        this.renderCommandEntry(cmd.name, cmd.description, cmd.sourcePackage);
      }
      process.stdout.write("\n");
    }

    // Commands grouped by namespace
    for (const ns of namespaces) {
      const commands = this.registry.getByNamespace(ns);
      this.renderCategoryHeader(ns);

      for (const cmd of commands) {
        this.renderCommandEntry(cmd.name, cmd.description, cmd.sourcePackage);

        // Render subcommands indented
        if (cmd.subcommands.length > 0) {
          for (const subName of cmd.subcommands) {
            const sub = this.registry.get(subName);
            if (sub) {
              this.renderCommandEntry(`  ${sub.name}`, sub.description, sub.sourcePackage);
            }
          }
        }
      }

      process.stdout.write("\n");
    }

    // Footer
    const total = this.registry.size();
    const nsCount = namespaces.length + (noNamespace.length > 0 ? 1 : 0);
    process.stdout.write(`  ${pc.dim(`${total} command(s) in ${nsCount} category(ies)`)}\n`);
    process.stdout.write(
      `  ${pc.dim(`Run "${this.config.binaryName} <command> --help" for usage info`)}\n`,
    );
  }

  /**
   * Render commands for a specific namespace only.
   *
   * @param namespace - The namespace to filter by
   */
  private renderNamespace(namespace: string): void {
    const commands = this.registry.getByNamespace(namespace);

    if (commands.length === 0) {
      this.output.info(`No commands found in the "${namespace}" category.`);
      return;
    }

    this.renderCategoryHeader(namespace);

    for (const cmd of commands) {
      this.renderCommandEntry(cmd.name, cmd.description, cmd.sourcePackage);
    }

    process.stdout.write(`\n  ${pc.dim(`${commands.length} command(s)`)}\n`);
  }

  /**
   * Render a styled category/namespace header.
   *
   * @param category - Category name
   */
  private renderCategoryHeader(category: string): void {
    // Route through `Str.ucfirst` per
    // `.kiro/steering/support-utilities.md` instead of the hand-rolled
    // `charAt(0).toUpperCase() + slice(1)` idiom.
    const label = Str.ucfirst(category);
    process.stdout.write(`  ${pc.yellow(pc.bold(label))}\n`);
  }

  /**
   * Render a single command entry with name, description, and optional source.
   *
   * @param name - ICommand name
   * @param description - ICommand description
   * @param source - Optional source package name
   */
  private renderCommandEntry(name: string, description: string, source?: string): void {
    const paddedName = name.padEnd(30);
    const sourceTag = source ? pc.dim(` [${source}]`) : "";
    process.stdout.write(`    ${pc.green(paddedName)} ${pc.dim(description)}${sourceTag}\n`);
  }
}
