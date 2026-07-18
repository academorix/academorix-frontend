/**
 * @file middleware-resolver.service.ts
 * @module @stackra/routing/middleware/services
 * @description Combines global + route-level guard and middleware
 *   references into a single priority-sorted pipeline chain.
 *
 *   Steps (in order):
 *     1. Expand group references (`@web` → members) via DFS. Cycles
 *        raise `MiddlewareCycleDetectedError` at resolution time.
 *     2. Resolve every reference against the guard + middleware
 *        registries. Unknown references are treated as fail-soft
 *        misses today (they'll fire a warning; F.2's pipeline runner
 *        wraps them in a hard error).
 *     3. Attach the guard-adapter priority (`1000` default) so guards
 *        outrank normal middleware in the final order.
 *     4. Sort by priority DESC, tie-broken by ascending declaration
 *        index (first-registered wins).
 *
 *   The resolver is stateless — every call reads the registries and
 *   re-computes the chain.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { ILoggerManager } from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

import type {
  IMiddlewareGroup,
  IPipelineResolutionInput,
  IResolvedPipelineEntry,
} from "@/core/interfaces";
import { DEFAULT_GUARD_PRIORITY, DEFAULT_MIDDLEWARE_PRIORITY } from "@/core/constants";

import { GuardRegistryService } from "@/guards/services/guard-registry.service";
import { MiddlewareCycleDetectedError } from "@/middleware/errors";
import { MiddlewareRegistryService } from "./middleware-registry.service";

/**
 * The middleware / guard resolver.
 */
@Injectable()
export class MiddlewareResolverService {
  public constructor(
    private readonly middleware: MiddlewareRegistryService,
    private readonly guards: GuardRegistryService,
    @Optional() @Inject(LOGGER_MANAGER) private readonly loggerManager?: ILoggerManager,
  ) {}

  /**
   * Resolve the merged pipeline chain for a route.
   *
   * @param input - Guards + middleware references from the route's
   *   inherited chain.
   * @returns Priority-sorted chain of resolved pipeline entries.
   * @throws {MiddlewareCycleDetectedError} If a middleware group has a
   *   cycle (per PLAN v3.12.6).
   */
  public resolve(input: IPipelineResolutionInput): readonly IResolvedPipelineEntry[] {
    const chain: IResolvedPipelineEntry[] = [];

    // 1. Guards — every guard reference maps to a `guard` entry.
    for (const ref of input.guards ?? []) {
      const entry = this.resolveGuard(ref);
      if (entry) chain.push(entry);
    }

    // 2. Middleware — group refs are expanded transitively; single
    //    refs resolve directly.
    for (const ref of input.middleware ?? []) {
      const entries = this.resolveMiddlewareRef(ref);
      chain.push(...entries);
    }

    // 3. Priority sort. Higher priority runs first; ties break by
    //    declaration order (ascending).
    return chain.slice().sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      // Same priority — preserve declaration order by NOT reordering.
      // Array#sort is stable in every modern JS runtime, so a `0`
      // return leaves the original order intact.
      return 0;
    });
  }

  // ── Private ────────────────────────────────────────────────────

  /**
   * Reify a single guard reference. Unknown names emit a warning and
   * yield `undefined` — the resolver still returns a chain for the
   * rest.
   */
  private resolveGuard(ref: unknown): IResolvedPipelineEntry | undefined {
    // String — look up by name.
    if (typeof ref === "string") {
      const entry = this.guards.get(ref);
      if (!entry) {
        this.warn(`Unknown guard reference '${ref}'.`);
        return undefined;
      }
      return {
        kind: "guard",
        name: entry.options.name,
        priority: entry.options.priority ?? DEFAULT_GUARD_PRIORITY,
        ctor: entry.ctor,
        source: `guard:${entry.options.name}`,
      };
    }

    // Class ref — look up by name derived from the registry.
    if (typeof ref === "function") {
      // Match against the class ctor stored in the registry. The
      // registry stores ctors keyed by name; we scan for the matching
      // ctor to find the guard entry.
      for (const [, entry] of this.guards.entries()) {
        if (entry.ctor === ref) {
          return {
            kind: "guard",
            name: entry.options.name,
            priority: entry.options.priority ?? DEFAULT_GUARD_PRIORITY,
            ctor: entry.ctor,
            source: `guard:${entry.options.name}`,
          };
        }
      }
      this.warn(
        `Guard class '${(ref as { name?: string }).name ?? "<anonymous>"}' not registered.`,
      );
      return undefined;
    }

    // Descriptor object — `{name, args?}`. F.1 uses only the name.
    if (typeof ref === "object" && ref !== null && "name" in ref) {
      const name = (ref as { name: string }).name;
      const entry = this.guards.get(name);
      if (!entry) {
        this.warn(`Unknown guard descriptor '${name}'.`);
        return undefined;
      }
      return {
        kind: "guard",
        name: entry.options.name,
        priority: entry.options.priority ?? DEFAULT_GUARD_PRIORITY,
        ctor: entry.ctor,
        source: `guard:${entry.options.name}`,
      };
    }

    return undefined;
  }

  /**
   * Reify a single middleware reference — string / class / group name.
   * Groups are expanded transitively; the expansion detects cycles.
   */
  private resolveMiddlewareRef(ref: unknown): IResolvedPipelineEntry[] {
    // Group reference — starts with `@`. Expand via DFS.
    if (typeof ref === "string" && ref.startsWith("@")) {
      return this.expandGroup(ref, new Set(), []);
    }

    // Plain middleware name.
    if (typeof ref === "string") {
      const entry = this.middleware.get(ref);
      if (!entry) {
        this.warn(`Unknown middleware reference '${ref}'.`);
        return [];
      }
      return [
        {
          kind: "middleware",
          name: entry.options.name,
          priority: entry.options.priority ?? DEFAULT_MIDDLEWARE_PRIORITY,
          ctor: entry.ctor,
          source: "route",
        },
      ];
    }

    // Class ref — locate the middleware entry by ctor identity.
    if (typeof ref === "function") {
      for (const [, entry] of this.middleware.entries()) {
        if (entry.ctor === ref) {
          return [
            {
              kind: "middleware",
              name: entry.options.name,
              priority: entry.options.priority ?? DEFAULT_MIDDLEWARE_PRIORITY,
              ctor: entry.ctor,
              source: "route",
            },
          ];
        }
      }
      this.warn(
        `Middleware class '${(ref as { name?: string }).name ?? "<anonymous>"}' not registered.`,
      );
      return [];
    }

    return [];
  }

  /**
   * Expand a group into its transitive member list. Uses `visited`
   * to detect cycles and `path` to build the error message.
   *
   * @param groupName - Name of the group to expand.
   * @param visited   - Groups already on the current DFS path.
   * @param path      - Ordered list of groups visited (for error text).
   * @throws {MiddlewareCycleDetectedError} If a cycle is detected.
   */
  private expandGroup(
    groupName: string,
    visited: Set<string>,
    path: readonly string[],
  ): IResolvedPipelineEntry[] {
    // Cycle detection — a group revisiting itself in the current DFS.
    if (visited.has(groupName)) {
      // Append the cycle-closing name so the message reads as a full
      // loop: `@a → @b → @a`.
      throw new MiddlewareCycleDetectedError(groupName, [...path, groupName]);
    }
    const group = this.middleware.getGroup(groupName);
    if (!group) {
      this.warn(`Unknown middleware group '${groupName}'.`);
      return [];
    }

    // Mark visited BEFORE recursing so nested cycles trip the check.
    const nextVisited = new Set(visited);
    nextVisited.add(groupName);
    const nextPath = [...path, groupName];

    const out: IResolvedPipelineEntry[] = [];
    for (const member of this.enumerateMembers(group)) {
      if (member.startsWith("@")) {
        // Nested group.
        out.push(...this.expandGroup(member, nextVisited, nextPath));
        continue;
      }
      // Plain middleware or guard name — look up in both registries
      // (groups may reference guard names uniformly per PLAN v3.7).
      const mwEntry = this.middleware.get(member);
      if (mwEntry) {
        out.push({
          kind: "middleware",
          name: mwEntry.options.name,
          priority: mwEntry.options.priority ?? DEFAULT_MIDDLEWARE_PRIORITY,
          ctor: mwEntry.ctor,
          source: `group:${group.name}`,
        });
        continue;
      }
      const guardEntry = this.guards.get(member);
      if (guardEntry) {
        out.push({
          kind: "guard",
          name: guardEntry.options.name,
          priority: guardEntry.options.priority ?? DEFAULT_GUARD_PRIORITY,
          ctor: guardEntry.ctor,
          source: `group:${group.name}`,
        });
        continue;
      }
      this.warn(`Group '${group.name}' member '${member}' not registered.`);
    }
    return out;
  }

  /** Enumerate a group's declared members. */
  private enumerateMembers(group: IMiddlewareGroup): readonly string[] {
    return group.members;
  }

  /** Emit a warning. Fail-soft when no logger is wired. */
  private warn(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.middleware").warn(message);
    } catch {
      // fail-soft
    }
  }
}
