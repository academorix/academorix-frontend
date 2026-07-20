/**
 * @file agent.registry.ts
 * @module @stackra/ai/core/registries
 * @description Registry of client-declared personas/agents keyed by slug.
 *
 *   Seeded in two phases:
 *
 *   1. **`OnModuleInit`** — personas declared in `config.personas` are
 *      registered from the resolved AI config (Req 14.2).
 *   2. **`OnApplicationBootstrap`** — the `PersonaDiscovery` service
 *      scans `@AiAgent(...)`-decorated providers and adds them (Req 14.3).
 *
 *   Consumers merge this local registry with the backend catalog
 *   (`AiClientService.listPersonas`) in `useAiCatalog`.
 */

import { Inject, Injectable, Optional, type OnModuleInit } from "@stackra/container";
import { Logger } from "@stackra/logger";
import { AI_CONFIG, type IAiConfig, type IPersona } from "@stackra/contracts";

/**
 * Persona registry — Requirement 14.
 */
@Injectable()
export class AgentRegistry implements OnModuleInit {
  private readonly logger = new Logger(AgentRegistry.name);
  private readonly items = new Map<string, IPersona>();
  private readonly listeners = new Set<() => void>();

  public constructor(@Optional() @Inject(AI_CONFIG) private readonly config?: IAiConfig) {}

  /** Seed personas declared in the AI config (Req 14.2). */
  public onModuleInit(): void {
    for (const persona of this.config?.personas ?? []) {
      this.register(persona);
    }
  }

  /**
   * Register (or replace) a persona.
   *
   * @param persona - Persona metadata.
   */
  public register(persona: IPersona): void {
    if (!persona.slug) {
      this.logger.warn("[AgentRegistry] ignoring persona without slug");
      return;
    }
    this.items.set(persona.slug, persona);
    this.notify();
  }

  /** Look up a persona by slug. */
  public get(slug: string): IPersona | undefined {
    return this.items.get(slug);
  }

  /** Whether a persona with the given slug is registered. */
  public has(slug: string): boolean {
    return this.items.has(slug);
  }

  /** Snapshot of every registered persona. */
  public all(): IPersona[] {
    return Array.from(this.items.values());
  }

  /** Number of registered personas. */
  public count(): number {
    return this.items.size;
  }

  /** Subscribe to registry changes. */
  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        this.logger.warn("[AgentRegistry] change listener threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
