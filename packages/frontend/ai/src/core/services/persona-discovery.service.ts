/**
 * @file persona-discovery.service.ts
 * @module @stackra/ai/core/services
 * @description Auto-discovery of `@AiAgent(...)`-decorated providers.
 *
 *   At application bootstrap, walks every DI provider carrying
 *   `AI_AGENT_METADATA` (via `discovery.getProvidersByMetadata`), reads
 *   the persona metadata, and registers each with the `AgentRegistry`.
 *
 *   Requirement 14.3.
 */

import "reflect-metadata";
import { Inject, Injectable, Optional, type OnApplicationBootstrap } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  AI_AGENT_METADATA,
  AI_AGENT_REGISTRY,
  DISCOVERY_SERVICE,
  type IDiscoveryService,
  type IPersona,
} from "@stackra/contracts";

import { AgentRegistry } from "../registries/agent.registry";

/**
 * PersonaDiscovery — Requirement 14.3.
 */
@Injectable()
export class PersonaDiscovery implements OnApplicationBootstrap {
  private readonly logger = new Logger(PersonaDiscovery.name);

  public constructor(
    @Inject(AI_AGENT_REGISTRY) private readonly registry: AgentRegistry,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discovery?: IDiscoveryService,
  ) {}

  public onApplicationBootstrap(): void {
    if (!this.discovery) {
      this.logger.debug?.(
        "[PersonaDiscovery] DISCOVERY_SERVICE not bound; skipping @AiAgent discovery",
      );
      return;
    }

    const providers = this.discovery.getProvidersByMetadata(AI_AGENT_METADATA);
    for (const wrapper of providers) {
      const instance = wrapper.instance as object | null;
      if (!instance) continue;
      const ctor = (instance as { constructor?: Function }).constructor;
      if (!ctor) continue;
      const persona = Reflect.getMetadata(AI_AGENT_METADATA, ctor) as IPersona | undefined;
      if (!persona) continue;
      this.registry.register(persona);
    }
  }
}
