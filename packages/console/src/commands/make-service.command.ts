/**
 * @file make-service.command.ts
 * @module @stackra/console/commands
 * @description `make:service` — scaffolds a new `@Injectable` service class
 *   from the `service.ejs` stub. Framework-general — every package can use
 *   it to spin up a new service without hand-writing the boilerplate.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { Path, Str } from "@stackra/support";

import { BaseCommand } from "../base";
import { Command } from "../decorators";
import { StubRenderer } from "../services/stub-renderer.service";

/**
 * Scaffold a new `@Injectable` service class.
 *
 * @example
 * ```bash
 * # In a package or app that has @stackra/console wired up:
 * stackra make:service route-registry \
 *   --module @stackra/routing/core/services \
 *   --description "Central registry of every route in the app."
 * ```
 */
@Command({
  name: "make:service",
  description: "Scaffold a new @Injectable service class from template.",
  arguments: [
    {
      name: "name",
      description: "Kebab-case service name (e.g., 'route-registry').",
      required: true,
    },
  ],
  options: [
    {
      name: "--description",
      short: "-d",
      description: "One-line description of what the service does.",
      type: "string",
    },
    {
      name: "--module",
      short: "-m",
      description:
        "Module scope for the emitted JSDoc @module tag (e.g., '@stackra/routing/services').",
      type: "string",
    },
    {
      name: "--path",
      short: "-p",
      description: "Output directory (relative to cwd).",
      type: "string",
      default: "src/services",
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
export class MakeServiceCommand extends BaseCommand {
  /**
   * @param stubRenderer - EJS renderer that owns the shared template
   *   environment (auto-injects `Str` from `@stackra/support`).
   */
  public constructor(private readonly stubRenderer: StubRenderer) {
    super();
  }

  /**
   * Execute the `make:service` command.
   *
   * @returns Numeric exit code (0 on success, 1 on failure).
   */
  public async handle(): Promise<number> {
    const name = this.argument<string>("name");
    let description = this.option<string>("description");
    let moduleName = this.option<string>("module");
    const outputPath = this.option<string>("path") ?? "src/services";
    const force = this.option<boolean>("force") ?? false;

    // Prompt for anything not supplied — the interactive flow means
    // `stackra make:service my-thing` alone still produces a valid file.
    if (!description) {
      description = await this.output.text("Enter a one-line description for the service:", {
        placeholder: "What does this service do?",
      });
    }
    if (!moduleName) {
      moduleName =
        (await this.output.text("Enter the JSDoc @module scope:", {
          placeholder: "@stackra/<pkg>/services",
        })) ?? "@stackra/<pkg>/services";
    }

    // Derive canonical names — Str.studly ensures PascalCase regardless
    // of the input casing / separators the operator typed.
    const className = `${Str.studly(name)}Service`;
    const fileName = `${Str.kebab(name)}.service.ts`;

    // Resolve destination + honor the existing-file guard.
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
    // `Path.packageRoot(import.meta.url, 2)` — this command file lives
    // at `packages/console/src/commands/`, so two levels up walks to
    // the package root where `stubs/` lives. Routes through
    // `@stackra/support` per `.kiro/steering/support-utilities.md`.
    const consolePackageRoot = Path.packageRoot(import.meta.url, 2);

    const { content } = this.stubRenderer.render({
      stub: "service",
      packageRoot: consolePackageRoot,
      variables: {
        name: Str.kebab(name),
        className,
        description,
        fileName,
        moduleName,
      },
    });

    // Ensure the destination directory exists before we write. Fail-fast
    // on any fs error — bubbles up as a non-zero exit code.
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content, "utf-8");

    this.output.success(`Service created: ${filePath}`);
    this.output.info(
      `Register ${className} as a provider in your module and inject it where needed.`,
    );
    return 0;
  }
}
