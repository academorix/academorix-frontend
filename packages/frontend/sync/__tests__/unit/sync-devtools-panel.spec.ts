/**
 * @file sync-devtools-panel.spec.ts
 * @module @stackra/sync/tests/unit
 * @description Unit tests for the `SyncDevtoolsPanel` — verifies
 *   the `@DevtoolsPanel(...)` decorator stamps the expected metadata,
 *   the panel implements `IDevtoolsPanel`, and the badge counter
 *   reflects the operation queue's pending count.
 */

import "reflect-metadata";

import { describe, expect, it } from "vitest";
import { DEVTOOLS_PANEL_METADATA_KEY, type IQueueStats } from "@stackra/contracts";

import { SyncDevtoolsPanel } from "@/react/devtools/sync.devtools-panel";
import type { OperationQueue } from "@/core/services/operation-queue.service";

/** Build an OperationQueue stub with the given stats snapshot. */
function makeQueue(stats: IQueueStats): OperationQueue {
  return {
    getStats: () => stats,
  } as unknown as OperationQueue;
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("SyncDevtoolsPanel", () => {
  it('stamps @DevtoolsPanel metadata with id "sync", data category, order 50', () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, SyncDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe("sync");
    expect(metadata?.title).toBe("Sync");
    expect(metadata?.category).toBe("data");
    expect(metadata?.order).toBe(50);
  });

  it("constructs with no engine / queue and exposes IDevtoolsPanel fields", () => {
    // Optional-inject — headless / test paths pass no engine or queue.
    const panel = new SyncDevtoolsPanel();
    expect(panel.id).toBe("sync");
    expect(panel.title).toBe("Sync");
    expect(panel.category).toBe("data");
    expect(panel.order).toBe(50);
    expect(panel.view.type).toBe("component");
  });

  it("badge() returns null when the queue is absent", () => {
    expect(new SyncDevtoolsPanel(undefined).badge()).toBeNull();
  });

  it("badge() returns null when the queue reports zero pending ops", () => {
    const panel = new SyncDevtoolsPanel(
      undefined,
      makeQueue({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 }),
    );
    expect(panel.badge()).toBeNull();
  });

  it("badge() returns the pending count when the queue reports > 0", () => {
    const panel = new SyncDevtoolsPanel(
      undefined,
      makeQueue({ total: 5, pending: 3, processing: 1, completed: 1, failed: 0 }),
    );
    expect(panel.badge()).toBe(3);
  });

  it("badge() returns null when the queue throws on read", () => {
    // fail-soft — a broken queue must not crash the badge.
    const throwingQueue = {
      getStats: (): never => {
        throw new Error("boom");
      },
    } as unknown as OperationQueue;
    expect(new SyncDevtoolsPanel(undefined, throwingQueue).badge()).toBeNull();
  });
});
