/**
 * @file scheduled-task-loader.test.ts
 * @module @stackra/scheduler/__tests__/unit
 * @description Behavioural tests for `ScheduledTaskLoader` — the
 *   `onApplicationBootstrap` scanner that discovers `@Scheduled()`
 *   classes and registers them with the scheduler service.
 */

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "vitest";

import { Scheduled } from "@/core/decorators/scheduled.decorator";
import { SchedulerService } from "@/core/services/scheduler.service";
import { ScheduledTaskLoader } from "@/core/services/scheduled-task-loader.service";
import { MockTaskRunner } from "@/testing/mock-task-runner";

import { MockDiscoveryService } from "../support/mock-discovery";

// ════════════════════════════════════════════════════════════════════════════
// Decorated test tasks
// ════════════════════════════════════════════════════════════════════════════

@Scheduled({ name: "sync-orders", every: 60_000, retries: 2 })
class SyncOrdersTask {
  public runs = 0;
  public async run(): Promise<void> {
    this.runs++;
  }
}

@Scheduled({ name: "heartbeat", every: 30_000, immediate: true })
class HeartbeatTask {
  public runs = 0;
  public async run(): Promise<void> {
    this.runs++;
  }
}

/** Decorated but lacks a `run()` method — must be rejected. */
@Scheduled({ name: "malformed", every: 60_000 })
class MalformedTask {
  // No `run` method.
}

/** Undecorated — filtered out at the discovery layer. */
class UndecoratedTask {
  public async run(): Promise<void> {}
}

// ════════════════════════════════════════════════════════════════════════════
// Specs
// ════════════════════════════════════════════════════════════════════════════

describe("ScheduledTaskLoader", () => {
  let runner: MockTaskRunner;
  let scheduler: SchedulerService;

  beforeEach(() => {
    runner = new MockTaskRunner();
    scheduler = new SchedulerService(runner);
  });

  it("registers every @Scheduled() class on bootstrap", () => {
    const orders = new SyncOrdersTask();
    const heartbeat = new HeartbeatTask();
    const discovery = new MockDiscoveryService([{ instance: orders }, { instance: heartbeat }]);
    const loader = new ScheduledTaskLoader(scheduler, discovery);

    loader.onApplicationBootstrap();

    const names = runner
      .getRegistered()
      .map((t) => t.name)
      .sort();
    expect(names).toEqual(["heartbeat", "sync-orders"]);
  });

  it("is a no-op without a discovery service", () => {
    const loader = new ScheduledTaskLoader(scheduler);
    expect(() => loader.onApplicationBootstrap()).not.toThrow();
    expect(runner.getRegistered()).toHaveLength(0);
  });

  it("routes discovered task.run() calls through the scheduler", async () => {
    const orders = new SyncOrdersTask();
    const discovery = new MockDiscoveryService([{ instance: orders }]);
    new ScheduledTaskLoader(scheduler, discovery).onApplicationBootstrap();

    await scheduler.runNow("sync-orders");
    expect(orders.runs).toBe(1);
  });

  it("skips decorated instances without a run() method", () => {
    const good = new SyncOrdersTask();
    const bad = new MalformedTask();
    const discovery = new MockDiscoveryService([{ instance: bad }, { instance: good }]);
    new ScheduledTaskLoader(scheduler, discovery).onApplicationBootstrap();

    expect(runner.getRegistered().map((t) => t.name)).toEqual(["sync-orders"]);
  });

  it("ignores undecorated classes returned by discovery", () => {
    const discovery = new MockDiscoveryService([{ instance: new UndecoratedTask() }]);
    new ScheduledTaskLoader(scheduler, discovery).onApplicationBootstrap();
    expect(runner.getRegistered()).toHaveLength(0);
  });

  it("propagates every field of @Scheduled() into the runner options", () => {
    const heartbeat = new HeartbeatTask();
    const discovery = new MockDiscoveryService([{ instance: heartbeat }]);
    new ScheduledTaskLoader(scheduler, discovery).onApplicationBootstrap();

    const entry = runner.getRegistered().find((t) => t.name === "heartbeat");
    expect(entry).toBeDefined();
    // `every` maps to `interval` on ITaskOptions.
    expect(entry!.interval).toBe(30_000);
  });
});
