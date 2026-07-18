/**
 * @file notification-manager.test.ts
 * @module @stackra/notifications/__tests__/unit
 * @description Behavioural tests for the {@link NotificationManager}.
 *
 *   The manager is constructed directly with an in-memory
 *   {@link InAppChannelDriver} + a captured config. Every path
 *   (registration, dispatch, driver failure, snapshot stability) is
 *   exercised without a full DI container.
 */

import { describe, expect, it } from 'vitest';

import { InAppChannelDriver } from '@/core/channels';
import { InAppNotificationCentre, NotificationManager } from '@/core/services';
import type {
  INotificationChannelDriver,
  INotificationModuleOptions,
  INotificationPayload,
} from '@/core/interfaces';

/**
 * Build a manager with the in-app channel pre-registered — matches
 * the wiring inside `NotificationModule.forRoot`.
 */
function buildManager(config: INotificationModuleOptions = {}): {
  readonly manager: NotificationManager;
  readonly centre: InAppNotificationCentre;
} {
  const centre = new InAppNotificationCentre(config);
  const manager = new NotificationManager(config);
  manager.register(new InAppChannelDriver(centre));
  return { manager, centre };
}

describe('NotificationManager — registration', () => {
  it('registers additional channel drivers dynamically', () => {
    const { manager } = buildManager();
    const driver: INotificationChannelDriver = {
      id: 'sms',
      async deliver(): Promise<void> {},
    };
    manager.register(driver);
    expect(manager.getSnapshot().channels).toContain('sms');
    expect(manager.getSnapshot().channels).toContain('in-app');
  });
});

describe('NotificationManager — dispatch', () => {
  it('routes to the in-app centre through the built-in driver', async () => {
    const { manager, centre } = buildManager();
    const payload: INotificationPayload = { title: 'Hello' };
    const reports = await manager.dispatch(payload);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.channelId).toBe('in-app');
    expect(reports[0]?.error).toBeNull();
    expect(centre.getSnapshot().items).toHaveLength(1);
  });

  it('routes to every registered driver when defaultStack is empty + no channels supplied', async () => {
    const { manager } = buildManager({ defaultStack: [] });
    const seen: string[] = [];
    manager.register({
      id: 'email',
      async deliver(payload) {
        seen.push(`email:${payload.title}`);
      },
    });
    const reports = await manager.dispatch({ title: 'Ping' });
    // Both `in-app` + `email` should have received the payload.
    expect(reports.map((r) => r.channelId).sort()).toEqual(['email', 'in-app']);
    expect(seen).toEqual(['email:Ping']);
  });

  it('honours an explicit channels override', async () => {
    const { manager } = buildManager({ defaultStack: ['in-app'] });
    manager.register({
      id: 'email',
      async deliver(): Promise<void> {},
    });
    const reports = await manager.dispatch({ title: 'x' }, { channels: ['email'] });
    expect(reports).toHaveLength(1);
    expect(reports[0]?.channelId).toBe('email');
  });

  it('records a failure when no driver is registered for a requested channel', async () => {
    const { manager } = buildManager();
    const reports = await manager.dispatch({ title: 'x' }, { channels: ['no-such-channel'] });
    expect(reports[0]?.error).toBeInstanceOf(Error);
    expect(reports[0]?.error?.message).toContain('no-such-channel');
  });

  it('fail-soft when a driver throws — the report captures the error', async () => {
    const { manager } = buildManager();
    manager.register({
      id: 'broken',
      async deliver(): Promise<void> {
        throw new Error('boom');
      },
    });
    const reports = await manager.dispatch({ title: 'x' }, { channels: ['broken', 'in-app'] });
    expect(reports[0]?.error?.message).toBe('boom');
    // The in-app driver still succeeded — a failing driver never
    // impacts the others.
    expect(reports[1]?.error).toBeNull();
  });
});

describe('NotificationManager — snapshot stability', () => {
  it('emits a fresh snapshot only when state changes', () => {
    const { manager } = buildManager();
    const first = manager.getSnapshot();
    expect(manager.getSnapshot()).toBe(first);
    manager.register({ id: 'sms', async deliver(): Promise<void> {} });
    const second = manager.getSnapshot();
    expect(second).not.toBe(first);
    expect(second.channels).toContain('sms');
  });
});
