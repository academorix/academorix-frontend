/**
 * @file test-cli.ts
 * @module @stackra/console/tests/e2e
 * @description Minimal CLI application for testing the console framework end-to-end.
 *   Uses the compiled dist to avoid path alias issues at runtime.
 */

import "reflect-metadata";
import { Module, Injectable, Inject } from "@stackra/container";
import { ApplicationFactory } from "@stackra/container";
import { CONSOLE_OUTPUT, DISCOVERY_SERVICE } from "@stackra/contracts";
import type { IConsoleOutput, IDiscoveryService, IDiscoveryProvider } from "@stackra/contracts";
import { defineMetadata, getMetadata } from "@vivtel/metadata";
import { ConsoleModule } from "../../src/console.module";
import { BaseCommand } from "../../src/base";
import { Command } from "../../src/decorators";
import { CommandRegistry } from "../../src/registries";
import { ConsoleOutput } from "../../src/services/console-output.service";
import { COMMAND_METADATA_KEY } from "../../src/constants";
import { renderBanner, renderCompactBanner } from "../../src/utils/ascii-banner.util";
import { fuzzyMatch } from "../../src/utils/fuzzy-match.util";

// ============================================================================
// Sample Commands
// ============================================================================

@Command({
  name: "greet",
  description: "Say hello to someone",
  arguments: [{ name: "name", description: "Name to greet", required: false, default: "World" }],
  options: [
    {
      name: "--loud",
      short: "-l",
      description: "Shout the greeting",
      type: "boolean",
      default: false,
    },
  ],
})
@Injectable()
class GreetCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<void> {
    const name = this.argumentOptional<string>("name") ?? "World";
    const loud = this.option<boolean>("loud") ?? false;
    const message = `Hello, ${name}!`;
    this.output.success(loud ? message.toUpperCase() : message);
  }
}

@Command({
  name: "cache:clear",
  description: "Clear the application cache",
})
@Injectable()
class CacheClearCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<void> {
    const spinner = this.output.spinner();
    spinner.start("Clearing cache...");
    await new Promise((resolve) => setTimeout(resolve, 100));
    spinner.stop("Cache cleared!", 0);
    this.output.success("Application cache has been flushed.");
  }
}

@Command({
  name: "cache:stats",
  description: "Show cache statistics",
})
@Injectable()
class CacheStatsCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<void> {
    this.output.table(
      ["Store", "Keys", "Hits", "Misses", "Hit Rate"],
      [
        ["memory", "142", "8,431", "312", "96.4%"],
        ["redis", "1,203", "45,291", "2,103", "95.6%"],
        ["null", "0", "0", "0", "N/A"],
      ],
    );
  }
}

@Command({
  name: "queue:work",
  description: "Process queue jobs",
  options: [
    { name: "--queue", short: "-q", description: "Queue name", type: "string", default: "default" },
  ],
})
@Injectable()
class QueueWorkCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<void> {
    const queue = this.option<string>("queue") ?? "default";
    this.output.info(`Processing queue: ${queue}`);
    const bar = this.output.progress({ total: 5, message: "Jobs" });
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      bar.increment();
    }
    bar.finish("All jobs processed");
  }
}

@Command({
  name: "app:status",
  description: "Show application status",
})
@Injectable()
class AppStatusCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<void> {
    this.output.intro("Application Status");
    await this.output.tasks([
      {
        title: "Checking database",
        task: async () => {
          await new Promise((r) => setTimeout(r, 50));
        },
      },
      {
        title: "Checking Redis",
        task: async () => {
          await new Promise((r) => setTimeout(r, 30));
        },
      },
      {
        title: "Checking queues",
        task: async () => {
          await new Promise((r) => setTimeout(r, 20));
        },
      },
    ]);
    this.output.outro("All systems operational");
  }
}

@Command({
  name: "app:info",
  description: "Show app info with enhanced output",
})
@Injectable()
class AppInfoCommand extends BaseCommand {
  public constructor(@Inject(CONSOLE_OUTPUT) output: IConsoleOutput) {
    super();
    (this as any).output = output;
  }

  public async handle(): Promise<void> {
    const out = this.output as any;

    out.box("Stackra Platform", "Enterprise-grade CLI framework\nwith theming, tables, and more.");

    out.separator(50, "Environment");
    out.pairs({
      "App Name": "stackra",
      Version: "0.1.0",
      "Node.js": process.version,
      Platform: process.platform,
      Arch: process.arch,
    });

    out.newLine();
    out.separator(50, "Packages");
    out.list(
      [
        "@stackra/console — CLI framework",
        "@stackra/contracts — Shared interfaces",
        "@stackra/events — Event system",
        "@stackra/cache — Cache manager",
        "@stackra/queue — Job processing",
      ],
      { style: "pointer" },
    );

    out.newLine();
    out.separator(50, "Config");
    out.json({
      binaryName: "stackra",
      verbose: true,
      theme: "default",
      packages: 5,
    });

    out.step("All systems operational");
    out.link("Documentation", "https://docs.stackra.com");
  }
}

const COMMAND_CLASSES = [
  GreetCommand,
  CacheClearCommand,
  CacheStatsCommand,
  QueueWorkCommand,
  AppStatusCommand,
  AppInfoCommand,
];

@Injectable()
class TestDiscoveryService implements IDiscoveryService {
  public constructor(@Inject(CONSOLE_OUTPUT) private readonly output: IConsoleOutput) {}

  public getProviders(): IDiscoveryProvider[] {
    return [];
  }

  public getProvidersByMetadata(key: string | symbol): IDiscoveryProvider[] {
    if (key !== COMMAND_METADATA_KEY) return [];

    return COMMAND_CLASSES.map((cls) => {
      const instance = Object.create(cls.prototype);
      instance.output = this.output;
      return {
        instance,
        metatype: cls,
        name: cls.name,
      };
    });
  }
}

// ============================================================================
// Test CLI Module
// ============================================================================

@Module({
  providers: [
    // Console config
    {
      provide: Symbol.for("CONSOLE_CONFIG"),
      useValue: {
        binaryName: "stackra",
        commandsDirectory: "src/commands/",
        verbose: true,
        commandPaths: [],
      },
    },
    // Core services
    { provide: CONSOLE_OUTPUT, useClass: ConsoleOutput },
    ConsoleOutput,
    CommandRegistry,
    { provide: DISCOVERY_SERVICE, useClass: TestDiscoveryService },
    // Commands
    GreetCommand,
    CacheClearCommand,
    CacheStatsCommand,
    QueueWorkCommand,
    AppStatusCommand,
    AppInfoCommand,
  ],
})
class TestCliModule {}

// ============================================================================
// Runner
// ============================================================================

async function main() {
  const app = await ApplicationFactory.createApplicationContext(TestCliModule, {
    logger: ["error"],
  });

  // Manually run discovery since we're not using ConsoleModule.forRoot()
  const registry = app.get(CommandRegistry);
  const output = app.get(CONSOLE_OUTPUT) as IConsoleOutput;

  // Register commands manually from our classes
  for (const cls of COMMAND_CLASSES) {
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
    // Banner + command list as table
    const banner = renderBanner({ name: "STACKRA", version: "0.1.0", environment: "test" });
    process.stdout.write(banner);

    const out = output as any;
    const allCommands = registry.getAll();

    // Build table rows grouped by namespace
    const rows: string[][] = allCommands.map((cmd) => [
      cmd.namespace ? `${cmd.namespace}:` : "",
      cmd.name,
      cmd.description,
    ]);

    out.table(["Category", "Command", "Description"], rows);

    out.info(
      `${registry.size()} command(s) registered across ${registry.getNamespaces().length + (registry.getByNamespace("").length > 0 ? 1 : 0)} categories`,
    );
    process.stdout.write("\n");
  } else {
    // Execute specific command
    const entry = registry.get(commandName);
    if (!entry) {
      const suggestions = fuzzyMatch(commandName, registry.getNames());
      output.error(`Command "${commandName}" not found.`);
      if (suggestions.length > 0) {
        output.info(`Did you mean: ${suggestions.join(", ")}?`);
      }
      await app.close();
      process.exit(1);
    }

    const command = app.get(entry.classRef) as BaseCommand;
    command.setCommandName(entry.name);

    // Parse args/options
    const parsedArgs: Record<string, unknown> = {};
    const parsedOpts: Record<string, unknown> = {};
    let argIndex = 0;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i]!;
      if (arg.startsWith("--")) {
        const optName = arg.slice(2);
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith("-")) {
          parsedOpts[optName] = nextArg;
          i++;
        } else {
          parsedOpts[optName] = true;
        }
      } else if (!arg.startsWith("-")) {
        const argDef = entry.arguments[argIndex];
        if (argDef) {
          parsedArgs[argDef.name] = arg;
          argIndex++;
        }
      }
    }

    const exitCode = await command.run(parsedArgs, parsedOpts);
    await app.close();
    process.exit(exitCode);
  }

  await app.close();
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
