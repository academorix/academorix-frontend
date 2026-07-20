/**
 * @file make-module.command.ts
 * @module @stackra/console/commands
 * @description `make:module` — scaffolds a new `@Module`-decorated class
 *   from the `module.ejs` stub. The rendered file comes with
 *   `forRoot(...)` + a `configurePublishables(...)` stub already wired,
 *   so newly-scaffolded modules participate in `vendor:publish` from
 *   day one.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { Path, Str } from "@stackra/support";

import { BaseCommand } from "../base";
import { Command } from "../decorators";
import { StubRenderer } from "../services/stub-renderer.service";

/**
 * Scaffold a new DI module class.
 *
 * @example
 * ```bash
 * stackra make:module notifications \
 *   --module @stackra/notifications/core \
 *   --description "Push notification module."
 * ```
 */
@Command({
  name: "make:module",
  description: "Scaffold a new @Module-decorated class with forRoot + configurePublishables wired.",
  arguments: [
    {
      name: "name",
      description: "Kebab-case module name (e.g., 'notifications').",
      required: true,
    },
  ],
  options: [
    {
      name: "--description",
      short: "-d",
      description: "One-line description of the module.",
      type: "string",
    },
    {
      name: "--module",
      short: "-m",
      description:
        "Package scope for the emitted @module tag (e.g., '@stackra/notifications/core').",
      type: "string",
    },
    {
      name: "--path",
      short: "-p",
      description: "Output directory (relative to cwd).",
      type: "string",
      default: "src/core",
    },
    {
      name: "--force",
      short: "-f",
      description: "Overwrite an existing file at the destination.",
      type: "boolean",
      default: false,
    },
  ],
})
export class MakeModuleCommand extends BaseCommand {
  /**
   * @param stubRenderer - EJS renderer that owns the shared template
   *   environment (auto-injects `Str` from `@stackra/support`).
   */
  public constructor(private readonly stubRenderer: StubRenderer) {
    super();
  }

  /**
   * Execute the `make:module` command.
   *
   * @returns Numeric exit code (0 on success, 1 on failure).
   */
  public async handle(): Promise<number> {
    const name = this.argument<string>("name");
    let description = this.option<string>("description");
    let moduleName = this.option<string>("module");
    const outputPath = this.option<string>("path") ?? "src/core";
    const force = this.option<boolean>("force") ?? false;

    if (!description) {
      description = await this.output.text("Enter a one-line description for the module:", {
        placeholder: "What does this module do?",
      });
    }
    if (!moduleName) {
      moduleName =
        (await this.output.text("Enter the JSDoc @module scope:", {
          placeholder: `@stackra/${Str.kebab(name)}/core`,
        })) ?? `@stackra/${Str.kebab(name)}/core`;
    }

    // Derive canonical names.
    const className = `${Str.studly(name)}Module`;
    const fileName = `${Str.kebab(name)}.module.ts`;

    const dir = resolve(process.cwd(), outputPath);
    const filePath = join(dir, fileName);

    if (existsSync(filePath) && !force) {
      const overwrite = await this.output.confirm(`File "${fileName}" already exists. Overwrite?`, {
        initialValue: false,
      });
      if (!overwrite) {
        this.output.info("Cancelled.");
        return 0;
      }
    }

    // Resolve the `@stackra/console` package root via
    // `Path.packageRoot(import.meta.url, 2)` (two levels up from
    // `packages/console/src/commands/`). Routes through
    // `@stackra/support` per `.kiro/steering/support-utilities.md`
    // instead of the raw
    // `path.dirname(fileURLToPath(import.meta.url))` dance.
    const consolePackageRoot = Path.packageRoot(import.meta.url, 2);

    const { content } = this.stubRenderer.render({
      stub: "module",
      packageRoot: consolePackageRoot,
      variables: {
        name: Str.kebab(name),
        className,
        description,
        fileName,
        moduleName,
      },
    });

    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content, "utf-8");

    this.output.success(`Module created: ${filePath}`);
    this.output.info(`Import ${className}.forRoot() into your AppModule to activate it.`);
    return 0;
  }
}
