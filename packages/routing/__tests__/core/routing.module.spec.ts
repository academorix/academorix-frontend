/**
 * @file routing.module.spec.ts
 * @module @stackra/routing/tests
 * @description Integration test — bootstrap the `RoutingModule` under
 *   `ApplicationFactory` and assert every advertised token resolves.
 */

import "reflect-metadata";
import { describe, expect, it } from "vitest";

import { ApplicationFactory, Module } from "@stackra/container";
import {
  ROUTE_MATCHER,
  ROUTE_REGISTRY,
  ROUTING_CONFIG,
  AI_ROUTE_CONTEXT,
  type IRoutingModuleOptions,
} from "@stackra/contracts";

import { RoutingModule } from "@/core/routing.module";
import { RouteRegistryService } from "@/core/services/route-registry.service";
import { RouteMatcherService } from "@/core/services/route-matcher.service";
import { AiRouteContextService } from "@/core/services/ai-route-context.service";
import { defineRoute } from "@/core/utils/define-route.util";

describe("RoutingModule", () => {
  it("forRoot binds every advertised token", async () => {
    @Module({
      imports: [RoutingModule.forRoot({ basename: "/", ai: false })],
    })
    class TestAppModule {}

    const app = await ApplicationFactory.create(TestAppModule);

    // Every advertised binding must resolve.
    expect(app.get(ROUTING_CONFIG)).toBeDefined();
    expect(app.get(ROUTE_REGISTRY)).toBeInstanceOf(RouteRegistryService);
    expect(app.get(ROUTE_MATCHER)).toBeInstanceOf(RouteMatcherService);
    expect(app.get(RouteRegistryService)).toBeInstanceOf(RouteRegistryService);
    expect(app.get(RouteMatcherService)).toBeInstanceOf(RouteMatcherService);

    // AI route context is NOT wired when `ai: false`.
    expect(() => app.get(AI_ROUTE_CONTEXT)).toThrow();

    // Config values propagate through mergeConfig.
    const config = app.get<IRoutingModuleOptions>(ROUTING_CONFIG);
    expect(config.basename).toBe("/");
    expect(config.ai).toBe(false);
    // Defaults are applied.
    expect(config.devMode).toBe("localhost");
    expect(config.prerender).toEqual({ enabled: true, outputDir: "dist" });

    await app.close();
  });

  it("forRoot wires the AI route context when ai=true", async () => {
    @Module({
      imports: [RoutingModule.forRoot({ ai: true })],
    })
    class TestAppModule {}

    const app = await ApplicationFactory.create(TestAppModule);
    expect(app.get(AI_ROUTE_CONTEXT)).toBeInstanceOf(AiRouteContextService);
    const svc = app.get<AiRouteContextService>(AI_ROUTE_CONTEXT);
    expect(svc.isEnabled()).toBe(true);
    await app.close();
  });

  it("forFeature seeds routes via createSeedLoader", async () => {
    const featureRoute = defineRoute({ path: "/blog/:slug" });

    @Module({
      imports: [
        RoutingModule.forRoot(),
        RoutingModule.forFeature({ name: "blog", routes: [featureRoute] }),
      ],
    })
    class TestAppModule {}

    const app = await ApplicationFactory.create(TestAppModule);
    const registry = app.get<RouteRegistryService>(RouteRegistryService);

    // The route was registered by the seed loader at bootstrap.
    const paths = registry.listRoutes().map((r) => r.path);
    expect(paths).toContain("/blog/:slug");
    // And tagged with the feature name.
    expect(registry.getSource("/blog/:slug")).toBe("feature:blog");
    await app.close();
  });

  it("forRootAsync accepts a factory + async config", async () => {
    @Module({
      imports: [
        RoutingModule.forRootAsync({
          useFactory: () => ({ basename: "/app", ai: false }),
        }),
      ],
    })
    class TestAppModule {}

    const app = await ApplicationFactory.create(TestAppModule);
    const config = app.get<IRoutingModuleOptions>(ROUTING_CONFIG);
    expect(config.basename).toBe("/app");
    await app.close();
  });
});
