/**
 * @file test-full-cli.ts
 * @module @stackra/console/tests/e2e
 * @description Full CLI test that includes commands from config and modules packages.
 *   Demonstrates how packages ship their own commands and the console discovers them.
 */

import "reflect-metadata";
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

// ============================================================================
// Config Package Commands (simulated — same logic as the real ones)
// ============================================================================

@Command({
  name: "config:publish",
  description: "Publish a package config file to the application config directory",
  arguments: [{ name: "package", description: "Package name", required: false }],
  options: [
    {
      name: "--force",
      short: "-f",
      description: "Overwrite without prompt",
      type: "boolean",
      default: false,
    },
    {
      name: "--all",
      short: "-a",
      description: "Publish all configs",
      type: "boolean",
      default: false,
    },
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
    const force = this.option<boolean>("force") ?? false;

    if (!pkg && !all) {
      this.output.error("Provide a package name or use --all.");
      return 1;
    }

    const out = this.output as any;
    if (all) {
      const packages = ["cache", "config", "console", "events", "logger", "queue", "redis"];
      out.table(
        ["Package", "Source", "Status"],
        packages.map((p) => [p, `packages/platform/${p}/config/${p}.config.ts`, "✓ published"]),
      );
      this.output.success(`Published ${packages.length} config file(s).`);
    } else {
      const source = `packages/platform/${pkg}/config/${pkg}.config.ts`;
      const dest = `config/${pkg}.config.ts`;
      (out as any).step(`${source} → ${dest}`);
      this.output.success(`Published config for "${pkg}"${force ? " (forced)" : ""}.`);
    }
    return 0;
  }
}

@Command({
  name: "config:cache",
  description: "Merge all config files into cached JSON for faster boot",
})
@Injectable()
class ConfigCacheCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<number> {
    const spinner = this.output.spinner();
    spinner.start("Reading config files...");
    await new Promise((r) => setTimeout(r, 200));
    spinner.stop("Config files parsed", 0);

    const out = this.output as any;
    out.table(
      ["File", "Keys", "Status"],
      [
        ["app.config.ts", "6", "✓ cached"],
        ["cache.config.ts", "4", "✓ cached"],
        ["logging.config.ts", "8", "✓ cached"],
        ["queue.config.ts", "5", "✓ cached"],
      ],
    );
    this.output.success("Configuration cache written to config/cache/config.json");
    return 0;
  }
}

@Command({
  name: "config:clear",
  description: "Clear the configuration cache",
})
@Injectable()
class ConfigClearCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<void> {
    this.output.success("Configuration cache cleared (2.4 KB freed).");
  }
}

// ============================================================================
// Module Package Commands (simulated)
// ============================================================================

@Command({
  name: "module:list",
  description: "List all discovered module manifests",
  options: [{ name: "--type", short: "-t", description: "Filter by type", type: "string" }],
})
@Injectable()
class ModuleListCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<void> {
    const out = this.output as any;
    out.separator(60, "Registered Modules");
    out.table(
      ["Name", "Version", "Type", "Slug", "Status"],
      [
        ["Cache Manager", "0.2.0", "platform", "cache", "active"],
        ["Event System", "0.3.0", "platform", "events", "active"],
        ["Queue Manager", "0.1.5", "platform", "queue", "active"],
        ["Redis Client", "1.0.0", "platform", "redis", "active"],
        ["Logger", "0.4.0", "platform", "logger", "active"],
        ["Config Manager", "0.2.1", "platform", "config", "active"],
        ["Console CLI", "0.1.0", "platform", "console", "active"],
        ["Scheduler", "0.1.0", "platform", "scheduler", "active"],
      ],
    );
    out.info("8 module(s) registered");
  }
}

@Command({
  name: "module:discover",
  description: "Discover and validate all module manifests in the workspace",
  options: [{ name: "--path", short: "-p", description: "Custom glob", type: "string" }],
})
@Injectable()
class ModuleDiscoverCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<number> {
    const spinner = this.output.spinner();
    spinner.start("Scanning for module manifests...");
    await new Promise((r) => setTimeout(r, 500));
    spinner.stop("Scan complete", 0);

    const out = this.output as any;
    out.table(
      ["Slug", "Type", "Path"],
      [
        ["cache", "platform", "packages/platform/cache/manifest.json"],
        ["events", "platform", "packages/platform/events/manifest.json"],
        ["queue", "platform", "packages/platform/queue/manifest.json"],
        ["redis", "platform", "packages/platform/redis/manifest.json"],
        ["logger", "platform", "packages/platform/logger/manifest.json"],
        ["config", "platform", "packages/platform/config/manifest.json"],
        ["console", "platform", "packages/platform/console/manifest.json"],
        ["scheduler", "platform", "packages/platform/scheduler/manifest.json"],
      ],
    );
    this.output.success("Registry populated with 8 module(s).");
    return 0;
  }
}

@Command({
  name: "module:validate",
  description: "Validate a module manifest file against the schema",
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
    const spinner = this.output.spinner();
    spinner.start(`Validating ${filePath}...`);
    await new Promise((r) => setTimeout(r, 300));
    spinner.stop("Manifest is valid", 0);

    this.output.success(`✓ ${filePath} passed validation`);
    const out = this.output as any;
    out.newLine();
    out.pairs({ Slug: "cache", Version: "0.2.0", Type: "platform", "Name (en)": "Cache Manager" });
    return 0;
  }
}

// ============================================================================
// Framework Commands (from console package)
// ============================================================================

@Command({ name: "list", description: "Display all available commands" })
@Injectable()
class ListCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }
  public async handle(): Promise<void> {
    /* handled by runner below */
  }
}

// ============================================================================
// All Commands
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

// ============================================================================
// Module & Runner
// ============================================================================

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
class FullTestCliModule {}

async function main() {
  const app = await ApplicationFactory.createApplicationContext(FullTestCliModule, {
    logger: ["error"],
  });
  const registry = app.get(CommandRegistry);
  const output = app.get(CONSOLE_OUTPUT) as IConsoleOutput;

  // Register all commands
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

  if (!commandName || commandName === "list") {
    const banner = renderBanner({ name: "STACKRA", version: "0.1.0", environment: "development" });
    process.stdout.write(banner);

    const out = output as any;
    const allCommands = registry.getAll();
    out.table(
      ["Category", "Command", "Description"],
      allCommands.map((cmd) => [cmd.namespace || "general", cmd.name, cmd.description]),
    );
    out.info(
      `${registry.size()} command(s) across ${registry.getNamespaces().length + 1} categories`,
    );
    process.stdout.write("\n");
  } else {
    const entry = registry.get(commandName);
    if (!entry) {
      const suggestions = fuzzyMatch(commandName, registry.getNames());
      output.error(`Command "${commandName}" not found.`);
      if (suggestions.length > 0) output.info(`Did you mean: ${suggestions.join(", ")}?`);
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
        const name = a.slice(2);
        const next = args[i + 1];
        if (next && !next.startsWith("-")) {
          parsedOpts[name] = next;
          i++;
        } else parsedOpts[name] = true;
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
