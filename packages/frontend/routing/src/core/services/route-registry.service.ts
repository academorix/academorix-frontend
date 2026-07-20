/**
 * @file route-registry.service.ts
 * @module @stackra/routing/core/services
 * @description The routing registry — holds the route tree.
 *
 *   Extends `BaseRegistry<string, IRouteRecord>` from `@stackra/support`.
 *   Seeded at `onModuleInit` from `ROUTING_CONFIG` — the routing
 *   config accepts an optional `routes` field (F.2 will surface it
 *   explicitly on the interface).
 *
 *   Uses a synthetic id for every route: `path || 'index-<counter>'`.
 *   Feature contributions register under their own ids so the tree
 *   holds a flat map keyed by route id.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";
import type {
  ILoggerManager,
  IRouteRecord,
  IRoutingModuleOptions,
  OnModuleInit,
} from "@stackra/contracts";
import { LOGGER_MANAGER, ROUTING_CONFIG } from "@stackra/contracts";

/**
 * The routing registry.
 *
 * The public shape mirrors ssr's `RouteRegistry` — a `Map<string,
 * IRouteRecord>` with per-source tagging so feature contributions
 * can be introspected in dev-tools.
 */
@Injectable()
export class RouteRegistryService
  extends BaseRegistry<string, IRouteRecord>
  implements OnModuleInit
{
  /** Source tagging — which module contributed each route. */
  private readonly sources: Map<string, string> = new Map();

  /** Auto-generated id counter for index routes / anonymous entries. */
  private idCounter = 0;

  public constructor(
    @Optional() @Inject(ROUTING_CONFIG) private readonly config?: IRoutingModuleOptions,
    @Optional() @Inject(LOGGER_MANAGER) private readonly loggerManager?: ILoggerManager,
  ) {
    super();
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  /**
   * Seed the registry from the module config. F.1 routes come in via
   * a `routes` field on the routing module options — F.2 will formalise
   * this on the interface. Fail-soft when the field is unset.
   */
  public onModuleInit(): void {
    // The `routes` field is not yet part of `IRoutingModuleOptions` —
    // it's added in F.2 when the `<StackraRoutingProvider>` needs it.
    // Read it defensively so F.1 tests can seed the registry from the
    // config today.
    const routes = (this.config as { routes?: readonly IRouteRecord[] } | undefined)?.routes;
    if (!routes || routes.length === 0) return;
    for (const route of routes) {
      this.registerRoute(route, "root");
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Register a single route record under an auto-generated id.
   *
   * @param route  - Route record to register.
   * @param source - Source label — `'root'`, `'feature:<name>'`, etc.
   * @returns The generated id.
   */
  public registerRoute(route: IRouteRecord, source: string = "root"): string {
    const id = this.generateId(route);
    if (this.has(id)) {
      // Duplicate id — log-and-replace so the app boots even on a
      // stray double-registration.
      this.warn(
        `Duplicate route id '${id}' — replacing the earlier registration (source: ${source}).`,
      );
      this.replace(id, route);
    } else {
      this.register(id, route);
    }
    this.sources.set(id, source);
    return id;
  }

  /**
   * Contribute a batch of routes (`RoutingModule.forFeature(...)`).
   *
   * @param routes - Route records.
   * @param source - Source label — `'feature:<name>'`.
   */
  public registerBatch(routes: readonly IRouteRecord[], source: string): void {
    for (const route of routes) {
      this.registerRoute(route, source);
    }
  }

  /**
   * List every registered route in insertion order.
   */
  public listRoutes(): readonly IRouteRecord[] {
    return this.values();
  }

  /**
   * Look up the source label for a registered route id.
   *
   * @param id - Route id returned from `registerRoute(...)`.
   * @returns Source label, or `undefined` when unknown.
   */
  public getSource(id: string): string | undefined {
    return this.sources.get(id);
  }

  /** Reset the registry — test-only. */
  public override clear(): this {
    super.clear();
    this.sources.clear();
    this.idCounter = 0;
    return this;
  }

  // ── Private ────────────────────────────────────────────────────

  /**
   * Generate a stable id for a route. Uses the explicit `id` when
   * present, else the `path`, else an incremented counter.
   */
  private generateId(route: IRouteRecord): string {
    if (typeof route.id === "string" && route.id.length > 0) return route.id;
    if (typeof route.path === "string" && route.path.length > 0) return route.path;
    // Index routes and paths that collapse to the empty string get a
    // deterministic counter so repeated registrations of the same
    // anonymous shape don't collide.
    this.idCounter += 1;
    return `route:${this.idCounter}`;
  }

  /** Emit a warning through the optional logger. Fail-soft. */
  private warn(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.registry").warn(message);
    } catch {
      // fail-soft
    }
  }
}
