/**
 * @file queue-devtools-panel.spec.ts
 * @module @stackra/queue/tests/unit
 * @description Unit tests for the `QueueDevtoolsPanel` — verifies the
 *   `@DevtoolsPanel(...)` decorator stamps the expected metadata,
 *   the panel implements `IDevtoolsPanel`, and the badge counter
 *   reflects the number of configured connections.
 */

import "reflect-metadata";

import { describe, expect, it } from "vitest";
import { DEVTOOLS_PANEL_METADATA_KEY } from "@stackra/contracts";

import type { IQueueModuleOptions } from "@/core/interfaces";
import { QueueDevtoolsPanel } from "@/react/devtools/queue.devtools-panel";

/** Build a fixture config with N connections. */
function makeConfig(connectionCount: number): IQueueModuleOptions {
  const connections: IQueueModuleOptions["connections"] = {};
  for (let i = 0; i < connectionCount; i++) {
    connections[`conn-${i}`] = { driver: "memory" };
  }
  return {
    default: "conn-0",
    connections,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("QueueDevtoolsPanel", () => {
  it('stamps @DevtoolsPanel metadata with id "queue", data category, order 20', () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, QueueDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe("queue");
    expect(metadata?.title).toBe("Queue");
    expect(metadata?.category).toBe("data");
    expect(metadata?.order).toBe(20);
  });

  it("constructs with a config and exposes IDevtoolsPanel fields", () => {
    const panel = new QueueDevtoolsPanel(makeConfig(2));
    expect(panel.id).toBe("queue");
    expect(panel.title).toBe("Queue");
    expect(panel.category).toBe("data");
    expect(panel.order).toBe(20);
    expect(panel.view.type).toBe("component");
  });

  it("badge() returns the number of configured connections", () => {
    expect(new QueueDevtoolsPanel(makeConfig(3)).badge()).toBe(3);
  });

  it("badge() returns null when the config has zero connections", () => {
    expect(new QueueDevtoolsPanel(makeConfig(0)).badge()).toBeNull();
  });

  it("badge() returns null when the config is absent", () => {
    // Missing config is a valid state — the panel is optional-inject
    // for headless / test scenarios where the queue module isn't wired.
    expect(new QueueDevtoolsPanel().badge()).toBeNull();
  });

  it("badge() returns null when the config throws on read", () => {
    // fail-soft — a broken config object must not crash the badge.
    const throwingConfig = {
      get connections(): never {
        throw new Error("boom");
      },
    } as unknown as IQueueModuleOptions;
    expect(new QueueDevtoolsPanel(throwingConfig).badge()).toBeNull();
  });
});
