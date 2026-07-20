/**
 * @file scheduler-module.test.ts
 * @module @stackra/scheduler/__tests__/unit
 * @description Structural tests for `SchedulerModule.forRoot()` —
 *   verifies the provider list, the useClass fallback for the task
 *   runner, and the override path for a caller-supplied runner.
 */

import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { SCHEDULER_CONFIG, SCHEDULER_SERVICE, TASK_RUNNER } from "@stackra/contracts";

import { SchedulerModule } from "@/core/scheduler.module";
import { SchedulerService } from "@/core/services/scheduler.service";
import { DefaultTaskRunner } from "@/core/services/default-task-runner.service";
import { ScheduledTaskLoader } from "@/core/services/scheduled-task-loader.service";
import { MockTaskRunner } from "@/testing/mock-task-runner";

describe("SchedulerModule.forRoot", () => {
  it("binds config, service, and the discovery loader globally", () => {
    const dyn = SchedulerModule.forRoot();

    expect(dyn.module).toBe(SchedulerModule);
    expect(dyn.global).toBe(true);

    // Config provider.
    const cfgProvider = dyn.providers!.find((p: any) => p.provide === SCHEDULER_CONFIG) as {
      useValue: unknown;
    };
    expect(cfgProvider).toBeDefined();

    // Scheduler service + useExisting alias.
    expect(dyn.providers).toContain(SchedulerService);
    const alias = dyn.providers!.find((p: any) => p.provide === SCHEDULER_SERVICE) as {
      useExisting: unknown;
    };
    expect(alias.useExisting).toBe(SchedulerService);

    // Loader.
    expect(dyn.providers).toContain(ScheduledTaskLoader);
  });

  it("exports config, service token, and service class", () => {
    const dyn = SchedulerModule.forRoot();
    expect(dyn.exports).toContain(SCHEDULER_CONFIG);
    expect(dyn.exports).toContain(SCHEDULER_SERVICE);
    expect(dyn.exports).toContain(SchedulerService);
    expect(dyn.exports).toContain(TASK_RUNNER);
  });

  it("defaults to DefaultTaskRunner via useClass", () => {
    const dyn = SchedulerModule.forRoot();
    const runnerProvider = dyn.providers!.find((p: any) => p.provide === TASK_RUNNER) as {
      useClass?: unknown;
      useValue?: unknown;
    };
    expect(runnerProvider.useClass).toBe(DefaultTaskRunner);
    // The bare `useClass` path — no useValue.
    expect(runnerProvider.useValue).toBeUndefined();
  });

  it("honours a caller-supplied runner via useValue", () => {
    const custom = new MockTaskRunner();
    const dyn = SchedulerModule.forRoot({ runner: custom });
    const runnerProvider = dyn.providers!.find((p: any) => p.provide === TASK_RUNNER) as {
      useValue?: unknown;
      useClass?: unknown;
    };
    expect(runnerProvider.useValue).toBe(custom);
    expect(runnerProvider.useClass).toBeUndefined();
  });
});
