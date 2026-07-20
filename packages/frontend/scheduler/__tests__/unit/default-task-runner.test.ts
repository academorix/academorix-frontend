/**
 * @file default-task-runner.test.ts
 * @module @stackra/scheduler/__tests__/unit
 * @description Behavioural tests for `DefaultTaskRunner` — interval
 *   + cron scheduling, overlap prevention, pause/resume, retries,
 *   and lifecycle hooks. Uses `vi.useFakeTimers()` so no real
 *   timer ever fires.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DefaultTaskRunner } from "@/core/services/default-task-runner.service";

describe("DefaultTaskRunner — registration + interval scheduling", () => {
  let runner: DefaultTaskRunner;

  beforeEach(() => {
    vi.useFakeTimers();
    runner = new DefaultTaskRunner();
  });

  afterEach(() => {
    // Unregister every task so lingering timers don't leak between specs.
    for (const task of runner.getRegistered()) runner.unregister(task.name);
    vi.useRealTimers();
  });

  it("records a registered task", () => {
    runner.register("sync", async () => {}, { interval: 1_000 });
    const list = runner.getRegistered();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe("sync");
    expect(list[0]!.interval).toBe(1_000);
  });

  it("runNow throws for an unregistered task", async () => {
    await expect(runner.runNow("missing")).rejects.toThrow(/not registered/);
  });

  it("fires the task on the configured interval", async () => {
    const fn = vi.fn(async () => {});
    runner.register("tick", fn, { interval: 1_000 });

    // Advance three intervals; setInterval fires the callback synchronously.
    await vi.advanceTimersByTimeAsync(3_100);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("immediate=true runs the task once at registration", async () => {
    const fn = vi.fn(async () => {});
    runner.register("boot", fn, { interval: 60_000, immediate: true });

    // Give the microtask queue a chance to drain — executeTask() is async.
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("re-registering a task replaces the previous entry", () => {
    runner.register("x", async () => {}, { interval: 1_000 });
    runner.register("x", async () => {}, { interval: 2_000 });
    const list = runner.getRegistered();
    expect(list).toHaveLength(1);
    expect(list[0]!.interval).toBe(2_000);
  });

  it("prevents overlapping executions on the same task", async () => {
    let running = 0;
    let peak = 0;
    const fn = vi.fn(async () => {
      running++;
      peak = Math.max(peak, running);
      // Simulate a slow task — 5s runtime, but only 1s between ticks.
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      running--;
    });
    runner.register("slow", fn, { interval: 1_000 });

    // Kick off several intervals; overlap guard should let only one run.
    await vi.advanceTimersByTimeAsync(3_500);
    expect(peak).toBe(1);
  });

  it("pause stops interval fires; resume restarts them", async () => {
    const fn = vi.fn(async () => {});
    runner.register("x", fn, { interval: 1_000 });

    await vi.advanceTimersByTimeAsync(1_100);
    expect(fn).toHaveBeenCalledTimes(1);

    runner.pause("x");
    await vi.advanceTimersByTimeAsync(3_000);
    // No fires while paused.
    expect(fn).toHaveBeenCalledTimes(1);
    // Introspection surfaces the paused flag.
    expect(runner.getRegistered()[0]!.isPaused).toBe(true);

    runner.resume("x");
    await vi.advanceTimersByTimeAsync(1_100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("unregister clears the timer and drops the entry", async () => {
    const fn = vi.fn(async () => {});
    runner.register("x", fn, { interval: 1_000 });

    runner.unregister("x");
    expect(runner.getRegistered()).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(fn).not.toHaveBeenCalled();
  });

  it("records lastRun after a successful execution", async () => {
    const fn = vi.fn(async () => {});
    runner.register("x", fn, { interval: 1_000 });

    await vi.advanceTimersByTimeAsync(1_100);
    const lastRun = runner.getRegistered()[0]!.lastRun;
    expect(typeof lastRun).toBe("number");
    expect(lastRun).toBeGreaterThan(0);
  });
});

describe("DefaultTaskRunner — retries", () => {
  let runner: DefaultTaskRunner;

  beforeEach(() => {
    vi.useFakeTimers();
    runner = new DefaultTaskRunner();
  });

  afterEach(() => {
    for (const task of runner.getRegistered()) runner.unregister(task.name);
    vi.useRealTimers();
  });

  it("retries up to `retries` times on failure", async () => {
    const attempts: number[] = [];
    let count = 0;
    const fn = vi.fn(async () => {
      count++;
      attempts.push(count);
      if (count <= 2) throw new Error("boom");
    });

    runner.register("flaky", fn, { interval: 60_000, retries: 3 });
    await runner.runNow("flaky");
    // Called at least 3 times: fail, fail, success.
    expect(count).toBe(3);
  });

  it("gives up after all retries are exhausted", async () => {
    let count = 0;
    const fn = vi.fn(async () => {
      count++;
      throw new Error("always");
    });

    runner.register("bad", fn, { interval: 60_000, retries: 2 });
    // Runner swallows the final failure — hooks track it separately.
    await runner.runNow("bad");
    // Called retries + 1 times (initial + retries).
    expect(count).toBe(3);
  });
});

describe("DefaultTaskRunner — lifecycle hooks", () => {
  let runner: DefaultTaskRunner;

  beforeEach(() => {
    vi.useFakeTimers();
    runner = new DefaultTaskRunner();
  });

  afterEach(() => {
    for (const task of runner.getRegistered()) runner.unregister(task.name);
    vi.useRealTimers();
  });

  it("fires onBefore → task → onSuccess → onAfter on success", async () => {
    const order: string[] = [];
    runner.register(
      "x",
      async () => {
        order.push("run");
      },
      {
        interval: 60_000,
        hooks: {
          onBefore: () => {
            order.push("before");
          },
          onSuccess: () => {
            order.push("success");
          },
          onAfter: () => {
            order.push("after");
          },
        },
      },
    );

    await runner.runNow("x");
    expect(order).toEqual(["before", "run", "success", "after"]);
  });

  it("fires onFailure + onAfter (never onSuccess) when the task keeps failing", async () => {
    const events: string[] = [];
    const err = new Error("boom");
    runner.register(
      "x",
      async () => {
        throw err;
      },
      {
        interval: 60_000,
        retries: 1,
        hooks: {
          onBefore: () => {
            events.push("before");
          },
          onSuccess: () => {
            events.push("success");
          },
          onFailure: (_name, error) => {
            events.push("failure:" + error.message);
          },
          onAfter: () => {
            events.push("after");
          },
        },
      },
    );

    await runner.runNow("x");
    expect(events).toEqual(["before", "failure:boom", "after"]);
    expect(events).not.toContain("success");
  });

  it("swallows errors thrown by lifecycle hooks", async () => {
    const fn = vi.fn(async () => {});
    runner.register("x", fn, {
      interval: 60_000,
      hooks: {
        // A throwing hook must never surface out of runNow.
        onBefore: () => {
          throw new Error("hook exploded");
        },
      },
    });

    await expect(runner.runNow("x")).resolves.toBeUndefined();
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("DefaultTaskRunner — cron", () => {
  let runner: DefaultTaskRunner;

  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze wall-clock at a known instant so cron scheduling is deterministic.
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    runner = new DefaultTaskRunner();
  });

  afterEach(() => {
    for (const task of runner.getRegistered()) runner.unregister(task.name);
    vi.useRealTimers();
  });

  it("records a cron task and exposes it via getRegistered", () => {
    runner.register("daily", async () => {}, { cron: "0 * * * *" });
    const list = runner.getRegistered();
    expect(list).toHaveLength(1);
    expect(list[0]!.cron).toBe("0 * * * *");
    // For cron tasks the interval field is 0 (no fixed interval).
    expect(list[0]!.interval).toBe(0);
  });

  it("fires a cron task exactly once per matching minute boundary", async () => {
    const fn = vi.fn(async () => {});
    // Hourly at :00 — starts at 12:00:00, so next fire is 13:00:00.
    runner.register("hourly", fn, { cron: "0 * * * *" });

    // Advance one hour + a bit of slack — the runner should schedule
    // exactly ONE fire at the :00 boundary. Prior to the cron-parser
    // fix, wildcard-minute expressions produced 60×/minute; now every
    // expression is minute-boundary-only.
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000 + 500);
    runner.unregister("hourly");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("`* * * * *` fires once at each minute boundary (regression guard)", async () => {
    const fn = vi.fn(async () => {});
    runner.register("every-minute", fn, { cron: "* * * * *" });

    // Advance a bit over a minute — exactly one fire.
    await vi.advanceTimersByTimeAsync(60_500);
    expect(fn).toHaveBeenCalledTimes(1);

    // Advance again — a second fire lands at the next minute boundary.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fn).toHaveBeenCalledTimes(2);

    runner.unregister("every-minute");
  });
});
