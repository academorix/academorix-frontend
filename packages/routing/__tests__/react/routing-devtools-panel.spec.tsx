/**
 * @file routing-devtools-panel.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the routing devtools panel.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { RouteRegistryService } from "@/core/services/route-registry.service";
import { RoutingDevtoolsPanel } from "@/react/devtools/routing-devtools-panel/routing.devtools-panel";

describe("RoutingDevtoolsPanel", () => {
  it("advertises the id, title, category, and order", () => {
    const registry = new RouteRegistryService();
    const panel = new RoutingDevtoolsPanel(registry);
    expect(panel.id).toBe("routing");
    expect(panel.title).toBe("Routing");
    expect(panel.category).toBe("framework");
    expect(panel.order).toBe(10);
  });

  it("returns null badge when the registry is empty", () => {
    const registry = new RouteRegistryService();
    const panel = new RoutingDevtoolsPanel(registry);
    expect(panel.badge()).toBeNull();
  });

  it("returns the route count when registrations exist", () => {
    const registry = new RouteRegistryService();
    registry.registerRoute({ path: "/", Component: () => null } as never);
    registry.registerRoute({ path: "/about", Component: () => null } as never);
    const panel = new RoutingDevtoolsPanel(registry);
    expect(panel.badge()).toBe(2);
  });
});
