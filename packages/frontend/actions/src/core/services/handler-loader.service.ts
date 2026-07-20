/**
 * @file handler-loader.service.ts
 * @module @stackra/actions/core/services
 * @description HandlerLoader — scans the DI container at
 *   `onApplicationBootstrap` for `@ActionHandler(kind)`-decorated
 *   classes and registers each with the {@link ActionRegistry}.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type {
  IActionDispatcher,
  IActionHandler,
  IDiscoveryService,
  ILoggerManager,
  OnApplicationBootstrap,
} from "@stackra/contracts";
import {
  ACTION_DISPATCHER,
  ACTION_HANDLER_METADATA,
  DISCOVERY_SERVICE,
  LOGGER_MANAGER,
} from "@stackra/contracts";

import { ActionRegistry } from "../registries/action.registry";

/**
 * Scans the container at bootstrap for decorated handlers and registers
 * them with the {@link ActionRegistry}.
 *
 * Uses `IDiscoveryService.getProvidersByMetadata` — never re-implements
 * a discovery scan. Registrations flow through
 * `IActionDispatcher.register` (not the registry directly) so
 * `ACTION_EVENTS.HANDLER_REGISTERED` fires consistently regardless of
 * whether a handler is seeded via `forFeature` or discovered via
 * decorator metadata.
 */
@Injectable()
export class HandlerLoader implements OnApplicationBootstrap {
  public constructor(
    private readonly registry: ActionRegistry,
    @Inject(ACTION_DISPATCHER) private readonly dispatcher: IActionDispatcher,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discovery?: IDiscoveryService,
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager,
  ) {}

  public onApplicationBootstrap(): void {
    if (!this.discovery) return;
    const providers = this.discovery.getProvidersByMetadata(ACTION_HANDLER_METADATA);
    for (const provider of providers) {
      const metatype = provider.metatype;
      if (!metatype) continue;
      const kind = Reflect.getMetadata(ACTION_HANDLER_METADATA, metatype) as string | undefined;
      if (!kind) continue;
      const handler = provider.instance as IActionHandler;
      // The registry check still runs so we can log a collision warning
      // BEFORE the dispatcher's own register method silently replaces —
      // helps debugging when two `@ActionHandler(kind)` classes clash.
      if (this.registry.has(kind)) {
        this.logger
          ?.channel("actions", "discovery")
          .warn(`[actions] @ActionHandler collision on kind "${kind}" — last-discovered wins.`);
      }
      // Route through the dispatcher (not `registry.register(...)`) so
      // `ACTION_EVENTS.HANDLER_REGISTERED` fires — matches the seeded
      // + imperative registration paths.
      this.dispatcher.register(handler);
    }
  }
}
