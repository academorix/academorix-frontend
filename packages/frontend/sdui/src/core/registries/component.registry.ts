/**
 * @file component.registry.ts
 * @module @stackra/sdui/core/registries
 * @description ComponentRegistry — name-keyed map of every renderable
 *   SDUI type, backed by `BaseRegistry` from `@stackra/support`.
 *
 *   Populated at boot by `SduiModule.forRoot`'s seed loader (core
 *   primitives + HeroUI compounds + consumer-supplied entries) plus
 *   `forFeature` contributions.
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";
import type { ISduiComponentEntry } from "@stackra/contracts";

/**
 * ComponentRegistry — `BaseRegistry<string, ISduiComponentEntry>`.
 */
@Injectable()
export class ComponentRegistry extends BaseRegistry<string, ISduiComponentEntry> {
  /**
   * Register a component. Last-wins semantics — collisions replace.
   */
  public override register(type: string, entry: ISduiComponentEntry): this {
    return this.replace(type, entry);
  }

  /** Resolve a component by node `type`, or `undefined` when unknown. */
  public resolve(type: string): ISduiComponentEntry | undefined {
    return this.get(type);
  }

  /** Every registered type. */
  public getTypes(): readonly string[] {
    return this.keys();
  }
}
