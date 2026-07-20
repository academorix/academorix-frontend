/**
 * @file live-cli.ts
 * @module @stackra/console/tests/e2e
 * @description LIVE CLI that reads real data from the monorepo.
 *   No mocks — all commands execute against actual files on disk.
 */

import "reflect-metadata";
import {
  existsSync,
  readFileSync,
  readdirSync,
  copyFileSync,
  mkdirSync,
  unlinkSync,
  statSync,
  writeFileSync,
} from "fs";
import { resolve, join, parse, relative } from "path";
import { fileURLToPath } from "url";

import { Module, Injectable, Inject } from "@stackra/container";
import { ApplicationFactory } from "@stackra/container";
import { CONSOLE_OUTPUT, DISCOVERY_SERVICE } from "@stackra/contracts";
import { getMetadata } from "@vivtel/metadata";

import { BaseCommand } from "../../src/base";
import { COMMAND_METADATA_KEY } from "../../src/constants";
import { Command } from "../../src/decorators";
import { CommandRegistry } from "../../src/registries";
import { ConsoleOutput } from "../../src/services/console-output.service";
import { renderBanner } from "../../src/utils/ascii-banner.util";
import { fuzzyMatch } from "../../src/utils/fuzzy-match.util";

import type { IConsoleOutput, IDiscoveryService, IDiscoveryProvider } from "@stackra/contracts";

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = resolve(__filename2, "..");
const ROOT = resolve(__dirname2, "../../../../.."); // monorepo root

// ============================================================================
// LIVE: config:publish
// ============================================================================
@Command({
  name: "config:publish",
  description: "Publish a package config file to the application config directory",
  arguments: [{ name: "package", description: "Package name", required: false }],
  options: [
    { name: "--force", short: "-f", description: "Overwrite without prompt", type: "boolean" },
    { name: "--all", short: "-a", description: "Publish all configs", type: "boolean" },
  ],
})
@Injectable()
class ConfigPublishCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<number> {
    const pkg = this.argumentOptional<string>("package");
    const all = this.option<boolean>("all") ?? false;
    const out = this.output as any;

    const packages = this.findPackagesWithConfigs();

    if (all) {
      out.table(
        ["Package", "Config File", "Status"],
        packages.map(([name, path]) => [name, relative(ROOT, path), "✓ publishable"]),
      );
      this.output.success(`Found ${packages.length} publishable config(s).`);
      return 0;
    }

    if (!pkg) {
      this.output.error("Provide a package name or use --all.");
      return 1;
    }

    const match = packages.find(([name]) => name === pkg);
    if (!match) {
      this.output.error(`No config found for package "${pkg}".`);
      out.info(
        `Available: ${packages
          .map(([n]) => n)
          .slice(0, 10)
          .join(", ")}...`,
      );
      return 1;
    }

    out.step(`${relative(ROOT, match[1])} → config/${pkg}.config.ts`);
    this.output.success(`Config for "${pkg}" is ready to publish.`);
    return 0;
  }

  private findPackagesWithConfigs(): [string, string][] {
    const results: [string, string][] = [];
    const dirs = ["packages/platform", "packages/infra", "packages/base", "packages/business"];
    for (const dir of dirs) {
      const full = resolve(ROOT, dir);
      if (!existsSync(full)) continue;
      for (const entry of readdirSync(full, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const configDir = join(full, entry.name, "config");
        if (!existsSync(configDir)) continue;
        const files = readdirSync(configDir).filter((f) => f.endsWith(".config.ts"));
        for (const f of files) {
          results.push([entry.name, join(configDir, f)]);
        }
      }
    }
    return results.sort((a, b) => a[0].localeCompare(b[0]));
  }
}

// ============================================================================
// LIVE: config:cache
// ============================================================================
@Command({ name: "config:cache", description: "Show config files available for caching" })
@Injectable()
class ConfigCacheCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<number> {
    const configDir = resolve(ROOT, "config");
    if (!existsSync(configDir)) {
      this.output.info("No config/ directory found at monorepo root.");
      return 0;
    }
    const files = readdirSync(configDir).filter((f) => f.endsWith(".config.ts"));
    if (files.length === 0) {
      this.output.info("No .config.ts files in config/ directory.");
      return 0;
    }
    (this.output as any).table(
      ["File", "Size"],
      files.map((f) => {
        const s = statSync(join(configDir, f));
        return [f, `${(s.size / 1024).toFixed(1)} KB`];
      }),
    );
    this.output.success(`${files.length} config file(s) ready for caching.`);
    return 0;
  }
}

// ============================================================================
// LIVE: config:clear
// ============================================================================
@Command({ name: "config:clear", description: "Clear the configuration cache" })
@Injectable()
class ConfigClearCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<void> {
    const cachePath = resolve(ROOT, "config", "cache", "config.json");
    if (!existsSync(cachePath)) {
      this.output.info("No configuration cache exists.");
      return;
    }
    const size = (statSync(cachePath).size / 1024).toFixed(1);
    this.output.success(`Cache exists at ${cachePath} (${size} KB) — ready to clear.`);
  }
}

// ============================================================================
// LIVE: module:list — reads actual manifest.json files
// ============================================================================
@Command({
  name: "module:list",
  description: "List all discovered module manifests from the workspace",
  options: [
    {
      name: "--type",
      short: "-t",
      description: "Filter by type (platform, infra, business)",
      type: "string",
    },
  ],
})
@Injectable()
class ModuleListCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<void> {
    const typeFilter = this.option<string>("type");
    const manifests = this.loadAllManifests();
    const filtered = typeFilter ? manifests.filter((m) => m.type === typeFilter) : manifests;

    if (filtered.length === 0) {
      this.output.info(
        typeFilter ? `No modules with type "${typeFilter}".` : "No manifests found.",
      );
      return;
    }

    const out = this.output as any;
    out.separator(70, `Modules${typeFilter ? ` (${typeFilter})` : ""}`);
    out.table(
      ["Name", "Version", "Type", "Slug"],
      filtered.map((m) => [m.name, m.version, m.type, m.slug]),
    );
    out.info(
      `${filtered.length} module(s) found${typeFilter ? ` (filtered by: ${typeFilter})` : ""}`,
    );
  }

  private loadAllManifests(): { slug: string; name: string; version: string; type: string }[] {
    const results: any[] = [];
    const dirs = ["packages/platform", "packages/infra", "packages/business", "packages/apps"];
    for (const dir of dirs) {
      const full = resolve(ROOT, dir);
      if (!existsSync(full)) continue;
      this.scanDir(full, results);
    }
    return results.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  private scanDir(dir: string, results: any[]): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = join(dir, entry.name, "manifest.json");
      if (existsSync(manifestPath)) {
        try {
          const content = JSON.parse(readFileSync(manifestPath, "utf-8"));
          results.push({
            slug: content.slug ?? entry.name,
            name: content.name?.en ?? content.slug ?? entry.name,
            version: content.version ?? "0.0.0",
            type: content.type ?? "unknown",
          });
        } catch {
          /* skip malformed */
        }
      }
      // Also check nested dirs (for verticals like packages/business/governance/tenant)
      const nestedDir = join(dir, entry.name);
      try {
        for (const nested of readdirSync(nestedDir, { withFileTypes: true })) {
          if (!nested.isDirectory()) continue;
          const nestedManifest = join(nestedDir, nested.name, "manifest.json");
          if (existsSync(nestedManifest)) {
            try {
              const content = JSON.parse(readFileSync(nestedManifest, "utf-8"));
              results.push({
                slug: content.slug ?? nested.name,
                name: content.name?.en ?? content.slug ?? nested.name,
                version: content.version ?? "0.0.0",
                type: content.type ?? "unknown",
              });
            } catch {
              /* skip malformed */
            }
          }
        }
      } catch {
        /* not a scannable dir */
      }
    }
  }
}

// ============================================================================
// LIVE: module:discover — count real manifests
// ============================================================================
@Command({ name: "module:discover", description: "Discover all module manifests in the workspace" })
@Injectable()
class ModuleDiscoverCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<number> {
    const spinner = this.output.spinner();
    spinner.start("Scanning workspace for manifest.json files...");

    const manifests = this.findAllManifests(ROOT);
    spinner.stop(`Found ${manifests.length} manifest(s)`, 0);

    // Group by type
    const byType: Record<string, number> = {};
    for (const m of manifests) {
      const type = m.type ?? "unknown";
      byType[type] = (byType[type] ?? 0) + 1;
    }

    const out = this.output as any;
    out.newLine();
    out.separator(60, "Discovery Results");
    out.table(
      ["Type", "Count", "Percentage"],
      Object.entries(byType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => [
          type,
          String(count),
          `${((count / manifests.length) * 100).toFixed(1)}%`,
        ]),
    );

    out.pairs({
      "Total manifests": String(manifests.length),
      "Types found": String(Object.keys(byType).length),
      "Scan root": ROOT,
    });

    this.output.newLine();
    this.output.success(`Workspace scan complete — ${manifests.length} modules discovered.`);
    return 0;
  }

  private findAllManifests(root: string): { slug: string; type: string }[] {
    const results: { slug: string; type: string }[] = [];
    const packagesDir = resolve(root, "packages");
    if (!existsSync(packagesDir)) return results;

    this.scanRecursive(packagesDir, results, 0);
    return results;
  }

  private scanRecursive(
    dir: string,
    results: { slug: string; type: string }[],
    depth: number,
  ): void {
    if (depth > 4) return; // max depth
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist")
          continue;
        const subDir = join(dir, entry.name);
        const manifestPath = join(subDir, "manifest.json");
        if (existsSync(manifestPath)) {
          try {
            const content = JSON.parse(readFileSync(manifestPath, "utf-8"));
            results.push({ slug: content.slug ?? entry.name, type: content.type ?? "unknown" });
          } catch {
            /* skip */
          }
        }
        this.scanRecursive(subDir, results, depth + 1);
      }
    } catch {
      /* permission error or similar */
    }
  }
}

// ============================================================================
// LIVE: module:validate — validates a real file
// ============================================================================
@Command({
  name: "module:validate",
  description: "Validate a module manifest file",
  arguments: [{ name: "path", description: "Path to manifest.json", required: true }],
})
@Injectable()
class ModuleValidateCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<number> {
    const filePath = this.argument<string>("path");
    const abs = resolve(ROOT, filePath);

    if (!existsSync(abs)) {
      this.output.error(`File not found: ${abs}`);
      return 1;
    }

    const spinner = this.output.spinner();
    spinner.start(`Validating ${filePath}...`);

    try {
      const content = JSON.parse(readFileSync(abs, "utf-8"));
      const errors: string[] = [];

      // Basic validation
      if (!content.slug) errors.push("Missing required field: slug");
      if (!content.version) errors.push("Missing required field: version");
      if (!content.name?.en) errors.push("Missing required field: name.en");
      if (!content.type) errors.push("Missing required field: type");

      if (errors.length > 0) {
        spinner.stop(`${errors.length} error(s) found`, 1);
        (this.output as any).list(errors, { style: "pointer" });
        return 1;
      }

      spinner.stop("Valid", 0);
      this.output.success(`✓ ${filePath} is valid`);
      (this.output as any).newLine();
      (this.output as any).pairs({
        Slug: content.slug,
        Version: content.version,
        Type: content.type,
        Name: content.name.en,
        Description: (content.description?.en ?? "-").slice(0, 60),
      });
      return 0;
    } catch (error: Error | any) {
      spinner.stop("Failed", 1);
      this.output.error(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }
}

// ============================================================================
// Framework: list
// ============================================================================
@Command({ name: "list", description: "Display all available commands" })
@Injectable()
class ListCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<void> {}
}

// ============================================================================
// Bootstrap
// ============================================================================

const ALL_COMMANDS = [
  ListCommand,
  ConfigPublishCommand,
  ConfigCacheCommand,
  ConfigClearCommand,
  ModuleListCommand,
  ModuleDiscoverCommand,
  ModuleValidateCommand,
];

@Module({
  providers: [
    {
      provide: Symbol.for("CONSOLE_CONFIG"),
      useValue: {
        binaryName: "stackra",
        commandsDirectory: "src/commands/",
        verbose: true,
        commandPaths: [],
      },
    },
    { provide: CONSOLE_OUTPUT, useClass: ConsoleOutput },
    ConsoleOutput,
    CommandRegistry,
    {
      provide: DISCOVERY_SERVICE,
      useValue: { getProviders: () => [], getProvidersByMetadata: () => [] },
    },
    ...ALL_COMMANDS,
  ],
})
class LiveCliModule {}

async function main() {
  const app = await ApplicationFactory.createApplicationContext(LiveCliModule, {
    logger: ["error"],
  });
  const registry = app.get(CommandRegistry);
  const output = app.get(CONSOLE_OUTPUT) as IConsoleOutput;

  for (const cls of ALL_COMMANDS) {
    const metadata = getMetadata<any>(COMMAND_METADATA_KEY, cls);
    if (metadata) {
      registry.register({
        name: metadata.name,
        description: metadata.description,
        namespace: CommandRegistry.extractNamespace(metadata.name),
        arguments: metadata.arguments ?? [],
        options: metadata.options ?? [],
        classRef: cls,
        subcommands: [],
      });
    }
  }

  const args = process.argv.slice(2);
  const commandName = args[0];

  // --version flag
  if (args.includes("--version") || args.includes("-V")) {
    process.stdout.write("@stackra/console v0.1.0\n");
    await app.close();
    process.exit(0);
  }

  // --help for a specific command
  if (commandName && commandName !== "list" && (args.includes("--help") || args.includes("-h"))) {
    const entry = registry.get(commandName);
    if (!entry) {
      output.error(`Command "${commandName}" not found.`);
      await app.close();
      process.exit(1);
    }
    const out = output as any;
    out.newLine();
    out.box(entry.name, entry.description);
    if (entry.arguments.length > 0) {
      out.separator(50, "Arguments");
      out.table(
        ["Name", "Required", "Default", "Description"],
        entry.arguments.map((a: any) => [
          a.name,
          a.required ? "yes" : "no",
          a.default ?? "-",
          a.description ?? "-",
        ]),
      );
    }
    if (entry.options.length > 0) {
      out.separator(50, "Options");
      out.table(
        ["Flag", "Short", "Type", "Default", "Description"],
        entry.options.map((o: any) => [
          o.name,
          o.short ?? "-",
          o.type,
          o.default !== undefined ? String(o.default) : "-",
          o.description,
        ]),
      );
    }
    await app.close();
    process.exit(0);
  }

  if (!commandName || commandName === "list") {
    const banner = renderBanner({ name: "STACKRA", version: "0.1.0", environment: "live" });
    process.stdout.write(banner);
    (output as any).table(
      ["Category", "Command", "Description"],
      registry.getAll().map((c) => [c.namespace || "general", c.name, c.description]),
    );
    (output as any).info(`${registry.size()} command(s) registered`);
    process.stdout.write("\n");
  } else {
    const entry = registry.get(commandName);
    if (!entry) {
      const suggestions = fuzzyMatch(commandName, registry.getNames());
      output.error(`Command "${commandName}" not found.`);
      if (suggestions.length > 0) (output as any).info(`Did you mean: ${suggestions.join(", ")}?`);
      await app.close();
      process.exit(1);
    }

    const command = app.get(entry.classRef) as BaseCommand;
    command.setCommandName(entry.name);

    const parsedArgs: Record<string, unknown> = {};
    const parsedOpts: Record<string, unknown> = {};
    let argIdx = 0;
    for (let i = 1; i < args.length; i++) {
      const a = args[i]!;
      if (a.startsWith("--")) {
        const n = a.slice(2);
        const next = args[i + 1];
        if (next && !next.startsWith("-")) {
          parsedOpts[n] = next;
          i++;
        } else parsedOpts[n] = true;
      } else if (!a.startsWith("-")) {
        const def = entry.arguments[argIdx];
        if (def) {
          parsedArgs[def.name] = a;
          argIdx++;
        }
      }
    }

    const exitCode = await command.run(parsedArgs, parsedOpts);
    await app.close();
    process.exit(exitCode);
  }
  await app.close();
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
