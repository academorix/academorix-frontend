/**
 * @file make-command.command.ts
 * @module @stackra/console/commands
 * @description Built-in command that scaffolds a new command file using the StubRenderer.
 *   Uses the `stubs/command.ejs` template with Str for string transformations.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { Path, Str } from "@stackra/support";

import { BaseCommand } from "../base";
import { Command } from "../decorators";
import { StubRenderer } from "../services/stub-renderer.service";

/**
 * Scaffold a new console command file.
 *
 * Uses the EJS stub template at `stubs/command.ejs` in the console package.
 * Generates a properly structured command class with decorators and docblocks.
 *
 * @example
 * ```bash
 * stackra make:command cache:warmup
 * stackra make:command queue:retry --description "Retry failed queue jobs"
 * stackra make:command cache:warmup --force
 * ```
 */
@Command({
  name: "make:command",
  description: "Scaffold a new console command file from template",
  arguments: [
    {
      name: "name",
      description: "Command name (colon-separated, e.g., cache:warmup)",
      required: true,
    },
  ],
  options: [
    { name: "--description", short: "-d", description: "Command description", type: "string" },
    {
      name: "--force",
      short: "-f",
      description: "Overwrite existing file",
      type: "boolean",
      default: false,
    },
    {
      name: "--path",
      short: "-p",
      description: "Output directory",
      type: "string",
      default: "src/commands",
    },
  ],
})
export class MakeCommandCommand extends BaseCommand {
  /**
   * @param stubRenderer - EJS template renderer for code generation
   */
  public constructor(private readonly stubRenderer: StubRenderer) {
    super();
  }

  /**
   * Execute the make:command command.
   *
   * @returns Exit code (0 for success, 1 for failure)
   */
  public async handle(): Promise<number> {
    const name = this.argument<string>("name");
    let description = this.option<string>("description");
    const force = this.option<boolean>("force") ?? false;
    const outputPath = this.option<string>("path") ?? "src/commands";

    // Prompt for description if not provided
    if (!description) {
      description = await this.output.text("Enter a description for the command:", {
        placeholder: "What does this command do?",
      });
    }

    // Derive names — Str.studly turns `cache:clear` → `CacheClear`, then we
    // append the `Command` suffix so the produced class name reads
    // naturally (`CacheClearCommand`).
    const className = `${Str.studly(name.replace(/:/g, "-"))}Command`;
    const fileName = `${name.replace(/:/g, "-")}.command.ts`;
    const moduleName = "@stackra/{package}";

    // Resolve output path
    const dir = resolve(process.cwd(), outputPath);
    const filePath = join(dir, fileName);

    // Check for existing file
    if (existsSync(filePath) && !force) {
      const overwrite = await this.output.confirm(`File "${fileName}" already exists. Overwrite?`, {
        initialValue: false,
      });
      if (!overwrite) {
        this.output.info("Cancelled.");
        return 0;
      }
    }

    // Render from stub template — resolve the `@stackra/console` package
    // root via `Path.packageRoot(import.meta.url, 2)` (two levels up from
    // `packages/console/src/commands/`). Routes through `@stackra/support`
    // per `.kiro/steering/support-utilities.md` instead of the raw
    // `path.dirname(fileURLToPath(import.meta.url))` dance.
    const consolePackageRoot = Path.packageRoot(import.meta.url, 2);

    const { content } = this.stubRenderer.render({
      stub: "command",
      packageRoot: consolePackageRoot,
      variables: {
        name,
        className,
        description,
        fileName,
        moduleName,
      },
    });

    // Write file
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, content, "utf-8");

    this.output.success(`Command created: ${filePath}`);
    this.output.pairs({
      Name: name,
      Class: className,
      File: fileName,
    });
    this.output.info("Register the command class as a provider in your module.");

    return 0;
  }
}
