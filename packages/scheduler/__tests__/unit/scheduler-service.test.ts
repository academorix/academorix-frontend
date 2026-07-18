/**
 * @file scheduler-service.test.ts
 * @module @stackra/scheduler/__tests__/unit
 * @description Behavioural tests for `SchedulerService` — the
 *   high-level orchestrator that wraps an `ITaskRunner` with
 *   lifecycle event emission.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SCHEDULER_EVENTS } from '@stackra/contracts';

import { SchedulerService } from '@/core/services/scheduler.service';
import { MockTaskRunner } from '@/testing/mock-task-runner';

import { RecordingEmitter } from '../support/recording-emitter';

describe('SchedulerService', () => {
  let runner: MockTaskRunner;
  let emitter: RecordingEmitter;
  let service: SchedulerService;

  beforeEach(() => {
    runner = new MockTaskRunner();
    emitter = new RecordingEmitter();
    service = new SchedulerService(runner, emitter);
  });

  it('registers a task through the runner and emits TASK_REGISTERED', async () => {
    const fn = vi.fn(async () => {});
    service.register('sync-orders', fn, { interval: 1_000 });

    // The runner stored the task.
    expect(runner.getRegistered()).toHaveLength(1);
    expect(runner.getRegistered()[0]!.name).toBe('sync-orders');

    // Emission of TASK_REGISTERED with the options.
    expect(emitter.emitted).toContainEqual({
      event: SCHEDULER_EVENTS.TASK_REGISTERED,
      payload: { name: 'sync-orders', options: { interval: 1_000 } },
    });
  });

  it('wraps register() to emit STARTED + COMPLETED around a successful run', async () => {
    const fn = vi.fn(async () => {});
    service.register('sync-orders', fn, { interval: 1_000 });
    emitter.reset();

    await service.runNow('sync-orders');
    expect(fn).toHaveBeenCalledOnce();

    const events = emitter.emitted.map((e) => e.event);
    expect(events).toContain(SCHEDULER_EVENTS.TASK_STARTED);
    expect(events).toContain(SCHEDULER_EVENTS.TASK_COMPLETED);
    // STARTED strictly precedes COMPLETED.
    const startedIndex = events.indexOf(SCHEDULER_EVENTS.TASK_STARTED);
    const completedIndex = events.indexOf(SCHEDULER_EVENTS.TASK_COMPLETED);
    expect(startedIndex).toBeLessThan(completedIndex);

    // COMPLETED payload carries a timestamp.
    const completed = emitter.emitted.find((e) => e.event === SCHEDULER_EVENTS.TASK_COMPLETED) as {
      payload: { name: string; timestamp: number };
    };
    expect(completed.payload.name).toBe('sync-orders');
    expect(typeof completed.payload.timestamp).toBe('number');
  });

  it('emits STARTED + FAILED and re-throws when the task throws', async () => {
    const err = new Error('task boom');
    const fn = vi.fn(async () => {
      throw err;
    });
    service.register('bad', fn, { interval: 1_000 });
    emitter.reset();

    await expect(service.runNow('bad')).rejects.toBe(err);

    const events = emitter.emitted.map((e) => e.event);
    expect(events).toContain(SCHEDULER_EVENTS.TASK_STARTED);
    expect(events).toContain(SCHEDULER_EVENTS.TASK_FAILED);

    const failed = emitter.emitted.find((e) => e.event === SCHEDULER_EVENTS.TASK_FAILED) as {
      payload: { name: string; error: Error };
    };
    expect(failed.payload.name).toBe('bad');
    expect(failed.payload.error).toBe(err);
  });

  it('unregister removes the task and emits TASK_UNREGISTERED', () => {
    service.register('x', async () => {}, { interval: 1_000 });
    emitter.reset();

    service.unregister('x');
    expect(runner.getRegistered()).toHaveLength(0);
    expect(emitter.emitted).toContainEqual({
      event: SCHEDULER_EVENTS.TASK_UNREGISTERED,
      payload: { name: 'x' },
    });
  });

  it('pause emits TASK_PAUSED and sets the flag on the runner', () => {
    service.register('x', async () => {}, { interval: 1_000 });
    emitter.reset();

    service.pause('x');
    expect(runner.getRegistered()[0]!.isPaused).toBe(true);
    expect(emitter.emitted).toContainEqual({
      event: SCHEDULER_EVENTS.TASK_PAUSED,
      payload: { name: 'x' },
    });
  });

  it('resume emits TASK_RESUMED', () => {
    service.register('x', async () => {}, { interval: 1_000 });
    service.pause('x');
    emitter.reset();

    service.resume('x');
    expect(runner.getRegistered()[0]!.isPaused).toBe(false);
    expect(emitter.emitted).toContainEqual({
      event: SCHEDULER_EVENTS.TASK_RESUMED,
      payload: { name: 'x' },
    });
  });

  it('getRegistered forwards to the runner', () => {
    service.register('x', async () => {}, { interval: 1_000 });
    service.register('y', async () => {}, { interval: 5_000 });
    const names = service
      .getRegistered()
      .map((t) => t.name)
      .sort();
    expect(names).toEqual(['x', 'y']);
  });

  it('operates without an event emitter injected', async () => {
    // The `@Optional` decorator lets consumers wire the service without
    // an emitter — every call is a no-op on the emit side.
    const bareService = new SchedulerService(runner);
    bareService.register('x', async () => {}, { interval: 1_000 });
    await expect(bareService.runNow('x')).resolves.toBeUndefined();
    bareService.pause('x');
    bareService.resume('x');
    bareService.unregister('x');
  });

  it('is fail-soft when the emitter throws', async () => {
    // Any listener throw must never break scheduling.
    const throwing = {
      emit: () => {
        throw new Error('subscriber exploded');
      },
      on: () => () => {},
      eventNames: () => [],
      listenerCount: () => 0,
      removeAllListeners: () => {},
    };
    const bareService = new SchedulerService(runner, throwing);
    expect(() => bareService.register('x', async () => {}, { interval: 1_000 })).not.toThrow();
    await expect(bareService.runNow('x')).resolves.toBeUndefined();
  });
});
