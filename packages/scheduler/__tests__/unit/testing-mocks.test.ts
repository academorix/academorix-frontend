/**
 * @file testing-mocks.test.ts
 * @module @stackra/scheduler/__tests__/unit
 * @description Verifies that `@stackra/scheduler/testing` exports —
 *   `MockScheduler`, `MockTaskRunner`, and their `createMock*`
 *   factories — match the current `ITaskRunner` and scheduler API.
 */

import { describe, it, expect, vi } from 'vitest';
import type { IScheduledTask, ITaskRunner } from '@/core/interfaces';

import {
  MockScheduler,
  MockTaskRunner,
  createMockScheduler,
  createMockTaskRunner,
} from '@/testing';

describe('MockTaskRunner', () => {
  it('conforms to ITaskRunner structurally', () => {
    const runner: ITaskRunner = new MockTaskRunner();
    expect(typeof runner.register).toBe('function');
    expect(typeof runner.unregister).toBe('function');
    expect(typeof runner.runNow).toBe('function');
    expect(typeof runner.getRegistered).toBe('function');
    expect(typeof runner.pause).toBe('function');
    expect(typeof runner.resume).toBe('function');
  });

  it('records registered tasks and exposes them via getRegistered', () => {
    const runner = new MockTaskRunner();
    runner.register('sync', async () => {}, { interval: 1_000 });
    const list = runner.getRegistered();
    expect(list).toHaveLength(1);
    const entry = list[0]!;
    expect(entry.name).toBe('sync');
    expect(entry.interval).toBe(1_000);
    expect(entry.isPaused).toBe(false);
  });

  it('runNow executes the task and tracks lastRun', async () => {
    const runner = new MockTaskRunner();
    const fn = vi.fn(async () => {});
    runner.register('x', fn, { interval: 1_000 });
    await runner.runNow('x');
    expect(fn).toHaveBeenCalledOnce();

    const entry = runner.getRegistered()[0]!;
    expect(entry.lastRun).toBeDefined();
    expect(entry.isRunning).toBe(false);
  });

  it('pause/resume toggles the flag without dropping the task', () => {
    const runner = new MockTaskRunner();
    runner.register('x', async () => {}, { interval: 1_000 });
    runner.pause('x');
    expect(runner.getRegistered()[0]!.isPaused).toBe(true);
    runner.resume('x');
    expect(runner.getRegistered()[0]!.isPaused).toBe(false);
  });

  it('runNow is a no-op for unregistered tasks (unlike DefaultTaskRunner which throws)', async () => {
    const runner = new MockTaskRunner();
    await expect(runner.runNow('missing')).resolves.toBeUndefined();
  });

  it('reset drops every task', () => {
    const runner = new MockTaskRunner();
    runner.register('a', async () => {}, { interval: 1_000 });
    runner.register('b', async () => {}, { interval: 2_000 });
    expect(runner.getRegistered()).toHaveLength(2);
    runner.reset();
    expect(runner.getRegistered()).toHaveLength(0);
  });

  it('runNow surfaces task errors', async () => {
    const runner = new MockTaskRunner();
    const err = new Error('boom');
    runner.register(
      'bad',
      async () => {
        throw err;
      },
      { interval: 1_000 }
    );
    await expect(runner.runNow('bad')).rejects.toBe(err);
  });
});

describe('MockScheduler', () => {
  it('mirrors the SchedulerService surface', () => {
    const mock = new MockScheduler();
    expect(typeof mock.register).toBe('function');
    expect(typeof mock.unregister).toBe('function');
    expect(typeof mock.runNow).toBe('function');
    expect(typeof mock.getRegistered).toBe('function');
    expect(typeof mock.pause).toBe('function');
    expect(typeof mock.resume).toBe('function');
    expect(typeof mock.reset).toBe('function');
  });

  it('delegates to its internal runner', async () => {
    const mock = new MockScheduler();
    const fn = vi.fn(async () => {});
    mock.register('x', fn, { interval: 1_000 });
    await mock.runNow('x');
    expect(fn).toHaveBeenCalledOnce();
    const list: IScheduledTask[] = mock.getRegistered();
    expect(list).toHaveLength(1);
  });
});

describe('createMockScheduler / createMockTaskRunner', () => {
  it('returns assertable proxies that record calls', () => {
    const scheduler = createMockScheduler();
    scheduler.register('x', async () => {}, { interval: 1_000 });

    // `wasCalled` returns a boolean; `callsFor` returns the raw records.
    expect(scheduler.$.wasCalled('register')).toBe(true);
    expect(scheduler.$.callCount('register')).toBe(1);

    // `callsFor` gives the full ICallRecord array for the method.
    const records = scheduler.$.callsFor('register');
    expect(records).toHaveLength(1);
    // Args order matches the method signature — [name, fn, options].
    expect(records[0]!.args[0]).toBe('x');
    expect(records[0]!.args[2]).toEqual({ interval: 1_000 });
  });

  it('createMockTaskRunner wraps a MockTaskRunner in an assertable proxy', () => {
    const runner = createMockTaskRunner();
    runner.register('x', async () => {}, { interval: 1_000 });
    expect(runner.$.wasCalled('register')).toBe(true);
    expect(runner.$.callCount('register')).toBe(1);
  });
});
