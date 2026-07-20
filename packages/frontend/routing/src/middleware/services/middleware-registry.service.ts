/**
 * @file middleware-registry.service.ts
 * @module @stackra/routing/middleware/services
 * @description The runtime middleware registry.
 *
 *   Holds every discovered `@Middleware`-decorated class + every named
 *   group. Populated by `MiddlewareLoaderService` at
 *   `onApplicationBootstrap` and (optionally) by
 *   `RoutingModule.forFeature({...})` seed loaders.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";
import type { ILoggerManager, IMiddlewareOptions } from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

import type { IMiddlewareEntry, IMiddlewareGroup } from "@/core/interfaces";

/**
 * The routing middleware registry.
 *
 * Extends `BaseRegistry<string, IMiddlewareEntry>` so it inherits
 * `register` / `get` / `has` / iteration primitives. Groups are held
 * in a sibling Map keyed by the group name (must start with `@`).
 *
 * @example
 * ```typescript
 * const registry = app.get<MiddlewareRegistryService>(MiddlewareRegistryService);
 * const audit = registry.get('audit');
 * ```
 */
@Injectable()
export class MiddlewareRegistryService extends BaseRegistry<string, IMiddlewareEntry> {
  /** Named groups — separate index because groups and entries share names spaces. */
  private readonly groups: Map<string, IMiddlewareGroup> = new Map();

  /** Monotonic counter used to break priority ties by declaration order. */
  private declarationCounter = 0;

  public constructor(
    @Optional() @Inject(LOGGER_MANAGER) private readonly loggerManager?: ILoggerManager,
  ) {
    super();
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Register a middleware class discovered by the loader.
   *
   * @param options - Metadata stamped by `@Middleware(...)`.
   * @param ctor    - Constructor to instantiate via DI at call time.
   * @returns `this` for chaining.
   */
  public registerMiddleware(options: IMiddlewareOptions, ctor: IMiddlewareEntry["ctor"]): this {
    const entry: IMiddlewareEntry = {
      options,
      ctor,
      declarationIndex: this.declarationCounter++,
    };
    if (this.has(options.name)) {
      // Duplicate names are almost always a misconfiguration — but a
      // registry throw would abort the whole bootstrap. Log-and-replace
      // is the more forgiving default (matches the ssr registry).
      this.warn(
        `Duplicate middleware name '${options.name}' — replacing the earlier registration.`,
      );
      this.replace(options.name, entry);
    } else {
      this.register(options.name, entry);
    }
    return this;
  }

  /**
   * Register a middleware group.
   *
   * @param group - Named bundle of middleware / guard / group references.
   * @returns `this` for chaining.
   */
  public registerGroup(group: IMiddlewareGroup): this {
    if (this.groups.has(group.name)) {
      this.warn(`Duplicate middleware group '${group.name}' — replacing the earlier registration.`);
    }
    this.groups.set(group.name, group);
    return this;
  }

  /**
   * Look up a named group.
   *
   * @param name - Group name (must include the leading `@`).
   * @returns The group entry, or `undefined` when unknown.
   */
  public getGroup(name: string): IMiddlewareGroup | undefined {
    return this.groups.get(name);
  }

  /** List every registered group. */
  public listGroups(): readonly IMiddlewareGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Reset the registry — test-only. Both the entries map and the
   * groups map are cleared, and the declaration counter is reset.
   */
  public override clear(): this {
    super.clear();
    this.groups.clear();
    this.declarationCounter = 0;
    return this;
  }

  // ── Private ────────────────────────────────────────────────────

  /**
   * Emit a warning through the optional logger. Fail-soft — the
   * registry must survive without a logger wired.
   */
  private warn(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.middleware").warn(message);
    } catch {
      // fail-soft — never let a logger failure break registration.
    }
  }
}
