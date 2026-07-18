/**
 * @file middleware-resolver.service.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the MiddlewareResolverService — group
 *   resolution, cycle detection, priority sort.
 */

import { describe, expect, it } from "vitest";

import { GuardRegistryService } from "@/guards/services/guard-registry.service";
import { MiddlewareCycleDetectedError } from "@/middleware/errors";
import { MiddlewareRegistryService } from "@/middleware/services/middleware-registry.service";
import { MiddlewareResolverService } from "@/middleware/services/middleware-resolver.service";
import type {
  ICanActivate,
  IMiddleware,
  IMiddlewareContext,
  IMiddlewareNext,
} from "@stackra/contracts";

/** Fake middleware class for registration. */
class AuditMiddleware implements IMiddleware {
  public async handle(_ctx: IMiddlewareContext, next: IMiddlewareNext): Promise<unknown> {
    return next();
  }
}
class SessionMiddleware implements IMiddleware {
  public async handle(_ctx: IMiddlewareContext, next: IMiddlewareNext): Promise<unknown> {
    return next();
  }
}
class HighPriorityMiddleware implements IMiddleware {
  public async handle(_ctx: IMiddlewareContext, next: IMiddlewareNext): Promise<unknown> {
    return next();
  }
}
class AuthGuardClass implements ICanActivate {
  public canActivate(): true {
    return true;
  }
}

/** Build a wired resolver with the provided registrations. */
function buildResolver(): {
  resolver: MiddlewareResolverService;
  middleware: MiddlewareRegistryService;
  guards: GuardRegistryService;
} {
  const middleware = new MiddlewareRegistryService();
  const guards = new GuardRegistryService();

  middleware.registerMiddleware({ name: "audit", priority: 100 }, AuditMiddleware);
  middleware.registerMiddleware({ name: "session", priority: 200 }, SessionMiddleware);
  middleware.registerMiddleware({ name: "high", priority: 500 }, HighPriorityMiddleware);

  guards.registerGuard({ name: "auth", priority: 1000 }, AuthGuardClass);

  const resolver = new MiddlewareResolverService(middleware, guards);
  return { resolver, middleware, guards };
}

describe("MiddlewareResolverService", () => {
  it("resolves guards before middleware (higher priority wins)", () => {
    const { resolver } = buildResolver();
    const chain = resolver.resolve({
      guards: ["auth"],
      middleware: ["audit"],
    });
    // Guard priority (1000) beats middleware priority (100) — guard first.
    expect(chain.map((c) => c.name)).toEqual(["auth", "audit"]);
  });

  it("honours explicit priorities within middleware", () => {
    const { resolver } = buildResolver();
    const chain = resolver.resolve({
      middleware: ["audit", "session", "high"],
    });
    // Higher priority runs first.
    expect(chain.map((c) => c.name)).toEqual(["high", "session", "audit"]);
  });

  it("preserves declaration order within the same priority", () => {
    const middleware = new MiddlewareRegistryService();
    const guards = new GuardRegistryService();
    class AMw implements IMiddleware {
      handle(_c: IMiddlewareContext, n: IMiddlewareNext): Promise<unknown> {
        return n();
      }
    }
    class BMw implements IMiddleware {
      handle(_c: IMiddlewareContext, n: IMiddlewareNext): Promise<unknown> {
        return n();
      }
    }
    middleware.registerMiddleware({ name: "a", priority: 100 }, AMw);
    middleware.registerMiddleware({ name: "b", priority: 100 }, BMw);
    const resolver = new MiddlewareResolverService(middleware, guards);
    const chain = resolver.resolve({ middleware: ["a", "b"] });
    expect(chain.map((c) => c.name)).toEqual(["a", "b"]);
  });

  it("expands a group reference into its member list", () => {
    const { resolver, middleware } = buildResolver();
    middleware.registerGroup({
      name: "@web",
      members: ["session", "audit"],
    });
    const chain = resolver.resolve({ middleware: ["@web"] });
    // 'session' (200) beats 'audit' (100) — order flips vs declaration.
    expect(chain.map((c) => c.name)).toEqual(["session", "audit"]);
  });

  it("mixes group members with guards uniformly (PLAN v3.7)", () => {
    const { resolver, middleware } = buildResolver();
    middleware.registerGroup({
      name: "@authenticated",
      // Group contains a guard name — resolver treats it uniformly.
      members: ["session", "auth"],
    });
    const chain = resolver.resolve({ middleware: ["@authenticated"] });
    const names = chain.map((c) => `${c.kind}:${c.name}`);
    // Guard runs first (priority 1000), then session (200).
    expect(names).toEqual(["guard:auth", "middleware:session"]);
  });

  it("throws MiddlewareCycleDetectedError on a self-referencing group", () => {
    const { resolver, middleware } = buildResolver();
    middleware.registerGroup({
      name: "@loop",
      members: ["@loop"],
    });
    expect(() => resolver.resolve({ middleware: ["@loop"] })).toThrow(MiddlewareCycleDetectedError);
  });

  it("detects transitive cycles across multiple groups", () => {
    const { resolver, middleware } = buildResolver();
    middleware.registerGroup({ name: "@a", members: ["@b"] });
    middleware.registerGroup({ name: "@b", members: ["@a"] });
    expect(() => resolver.resolve({ middleware: ["@a"] })).toThrow(MiddlewareCycleDetectedError);
  });

  it("resolves guard descriptor objects by name", () => {
    const { resolver } = buildResolver();
    const chain = resolver.resolve({
      guards: [{ name: "auth" }],
    });
    expect(chain.map((c) => c.name)).toEqual(["auth"]);
  });

  it("resolves guard class refs by identity", () => {
    const { resolver } = buildResolver();
    const chain = resolver.resolve({
      guards: [AuthGuardClass],
    });
    expect(chain.map((c) => c.name)).toEqual(["auth"]);
  });

  it("resolves middleware class refs by identity", () => {
    const { resolver } = buildResolver();
    const chain = resolver.resolve({
      middleware: [AuditMiddleware],
    });
    expect(chain.map((c) => c.name)).toEqual(["audit"]);
  });

  it("silently drops unknown references (fail-soft in F.1)", () => {
    const { resolver } = buildResolver();
    const chain = resolver.resolve({
      middleware: ["does-not-exist"],
    });
    expect(chain).toEqual([]);
  });
});
