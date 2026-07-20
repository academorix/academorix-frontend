/**
 * @file command-loader.service.ts
 * @module @stackra/console/services
 * @description Auto-discovers `@Command()`-decorated classes during the
 *   `OnApplicationBootstrap` phase using the `DISCOVERY_SERVICE` pattern.
 *   Validates each class extends `BaseCommand`, extracts its metadata, and
 *   registers it in the `CommandRegistry`.
 *
 *   Runs at `OnApplicationBootstrap` (never `OnModuleInit`) per
 *   `.kiro/steering/discovery-vs-loader.md` — loaders scan OTHER modules'
 *   providers, so the module graph must be fully settled before we look.
 */

import { Inject, Injectable, type OnApplicationBootstrap } from "@stackra/container";
import { DISCOVERY_SERVICE, type Type } from "@stackra/contracts";
import { getMetadata } from "@vivtel/metadata";

import { BaseCommand } from "../base";
import { COMMAND_METADATA_KEY } from "../constants";
import { CommandRegistry } from "../registries";

import type { ICommandMetadata, IRegisteredCommand } from "../interfaces";
import type { IDiscoveryService } from "@stackra/contracts";

/**
 * Auto-discovery loader for console commands.
 *
 * Consumers never touch this directly — `ConsoleModule.forRoot()` wires it
 * in and the container drives the lifecycle. The loader relies on the
 * platform-agnostic `DISCOVERY_SERVICE` contract so it works identically
 * under the container's reflection-based discovery + any future
 * build-time-manifest discovery implementation.
 */
@Injectable()
export class CommandLoader implements OnApplicationBootstrap {
  /**
   * @param discovery - Platform-agnostic discovery service.
   * @param registry - Command registry populated from discovery.
   */
  public constructor(
    @Inject(DISCOVERY_SERVICE) private readonly discovery: IDiscoveryService,
    private readonly registry: CommandRegistry,
  ) {}

  /**
   * Discover and register every `@Command()`-decorated provider.
   *
   * Runs once after every module has finished `OnModuleInit`. For each
   * matching provider: skip if we can't reach its class reference, skip
   * if it doesn't extend `BaseCommand`, skip if its metadata reads back
   * empty, then build a `IRegisteredCommand` and register it.
   */
  public onApplicationBootstrap(): void {
    const providers = this.discovery.getProvidersByMetadata(COMMAND_METADATA_KEY);

    for (const provider of providers) {
      const { instance, metatype } = provider;

      // Skip factory-provided or otherwise class-less registrations —
      // we can't validate them against `BaseCommand`.
      if (!metatype) continue;

      // Every command MUST extend `BaseCommand` so `run(args, options)`
      // works and `this.output` is wired via `@Inject(CONSOLE_OUTPUT)`.
      if (!(instance instanceof BaseCommand)) continue;

      // Read the metadata that `@Command()` stamped onto the class.
      const metadata = getMetadata<ICommandMetadata>(COMMAND_METADATA_KEY, metatype);
      if (!metadata) continue;

      const entry: IRegisteredCommand = {
        name: metadata.name,
        description: metadata.description,
        namespace: CommandRegistry.extractNamespace(metadata.name),
        arguments: metadata.arguments ?? [],
        options: metadata.options ?? [],
        classRef: metatype as unknown as Type<unknown>,
        parent: metadata.parent,
        subcommands: [],
      };

      this.registry.register(entry);
    }
  }
}
