/**
 * @file testing-mocks.test.ts
 * @module @stackra/realtime/__tests__/unit
 * @description Verifies that `@stackra/realtime/testing` mocks still
 *   match the current production API and that the assertable proxy
 *   surface works.
 */

import { describe, it, expect } from 'vitest';

import {
  MockRealtimeManager,
  MockRealtimeConnection,
  MockRealtimeChannel,
  MockRealtimePresenceChannel,
  createMockRealtime,
  createMockRealtimeConnection,
} from '@/testing';

describe('MockRealtimeManager', () => {
  it('resolves the same connection for a given name', async () => {
    const manager = new MockRealtimeManager();
    const first = await manager.connection('main');
    const second = await manager.connection('main');
    expect(first).toBe(second);
  });

  it('uses the default connection name when none is passed', async () => {
    const manager = new MockRealtimeManager();
    manager.setDefaultDriver('primary');
    expect(manager.getDefaultDriver()).toBe('primary');

    const c = await manager.connection();
    // Same instance as connection('primary').
    expect(await manager.connection('primary')).toBe(c);
  });

  it('registerConnection stores a custom connection', async () => {
    const manager = new MockRealtimeManager();
    const custom = new MockRealtimeConnection();
    manager.registerConnection('main', custom);
    expect(await manager.connection('main')).toBe(custom);
  });

  it('disconnect(name) drops the cached connection and disconnects it', async () => {
    const manager = new MockRealtimeManager();
    const conn = await manager.connection('main');
    await manager.disconnect('main');
    expect(conn.isConnected()).toBe(false);
    // A subsequent `connection('main')` returns a fresh instance.
    const next = await manager.connection('main');
    expect(next).not.toBe(conn);
  });

  it('disconnectAll clears every connection', async () => {
    const manager = new MockRealtimeManager();
    await manager.connection('a');
    await manager.connection('b');
    expect(manager.getConnectionNames().sort()).toEqual(['a', 'b']);

    await manager.disconnectAll();
    expect(manager.getConnectionNames()).toEqual([]);
  });
});

describe('MockRealtimeConnection', () => {
  it('caches channels by name (regular + private + presence share separate namespaces)', () => {
    const conn = new MockRealtimeConnection();
    const orders = conn.channel('orders');
    const same = conn.channel('orders');
    expect(same).toBe(orders);

    const priv = conn.privateChannel('orders');
    const presence = conn.presenceChannel('orders');
    expect(priv).not.toBe(orders);
    expect(presence).not.toBe(orders);
    expect(presence).not.toBe(priv);

    // Names carry the namespace prefix.
    expect((priv as MockRealtimeChannel).name).toBe('private:orders');
    expect((presence as MockRealtimeChannel).name).toBe('presence:orders');
  });

  it('records whispers on the shared ledger', () => {
    const conn = new MockRealtimeConnection();
    const orders = conn.channel('orders');
    orders.whisper('created', { id: 1 });
    orders.whisper('deleted', { id: 2 });

    expect(conn.whispers).toHaveLength(2);
    expect(conn.whispers[0]!.event).toBe('created');
    expect(conn.whispers[1]!.event).toBe('deleted');
  });

  it('simulateIncoming triggers registered listeners', () => {
    const conn = new MockRealtimeConnection();
    const orders = conn.channel('orders');

    const received: unknown[] = [];
    orders.on('created', (data) => received.push(data));
    conn.simulateIncoming('orders', 'created', { id: 42 });

    expect(received).toEqual([{ id: 42 }]);
  });

  it('simulateIncoming is a no-op on an unknown channel', () => {
    const conn = new MockRealtimeConnection();
    // No channel called 'orders' yet — must not throw.
    expect(() => conn.simulateIncoming('orders', 'created', { id: 1 })).not.toThrow();
  });

  it('disconnect marks the connection and leaves every channel', () => {
    const conn = new MockRealtimeConnection();
    const orders = conn.channel('orders') as MockRealtimeChannel;
    conn.disconnect();
    expect(conn.isConnected()).toBe(false);
    expect(orders.isLeft()).toBe(true);
  });
});

describe('MockRealtimeChannel', () => {
  it('supports on/off for listener registration', () => {
    const conn = new MockRealtimeConnection();
    const channel = conn.channel('orders') as MockRealtimeChannel;
    const received: unknown[] = [];
    const handler = (data: unknown) => received.push(data);

    channel.on('created', handler);
    conn.simulateIncoming('orders', 'created', { id: 1 });
    expect(received).toEqual([{ id: 1 }]);

    channel.off('created', handler);
    conn.simulateIncoming('orders', 'created', { id: 2 });
    // No more deliveries after off().
    expect(received).toEqual([{ id: 1 }]);
  });

  it('does not fire listeners after leave()', () => {
    const conn = new MockRealtimeConnection();
    const channel = conn.channel('orders') as MockRealtimeChannel;
    const received: unknown[] = [];
    channel.on('created', (data) => received.push(data));
    channel.leave();
    conn.simulateIncoming('orders', 'created', { id: 1 });
    // Guarded by the internal `left` flag.
    expect(received).toEqual([]);
  });
});

describe('MockRealtimePresenceChannel', () => {
  it('here() fires when simulatePresence() runs (fires every registered here callback)', () => {
    const conn = new MockRealtimeConnection();
    const presence = conn.presenceChannel('room') as MockRealtimePresenceChannel;

    const rosters: unknown[][] = [];
    presence.here((members) => rosters.push(members));
    presence.simulatePresence([{ id: 'a' }, { id: 'b' }]);
    // `here()` also delivers the initial roster once at registration —
    // it captures the empty initial state (roster is []) at registration
    // time, then the simulated snapshot fires as a second delivery.
    expect(rosters.length).toBeGreaterThanOrEqual(1);
    // The most recent delivery is the simulated snapshot.
    expect(rosters[rosters.length - 1]).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('joining/leaving fire on membership changes', () => {
    const conn = new MockRealtimeConnection();
    const presence = conn.presenceChannel('room') as MockRealtimePresenceChannel;

    const joined: unknown[] = [];
    const left: unknown[] = [];
    presence.joining((m) => joined.push(m));
    presence.leaving((m) => left.push(m));

    const alice = { id: 'alice' };
    const bob = { id: 'bob' };
    presence.simulateJoining(alice);
    presence.simulateJoining(bob);
    presence.simulateLeaving(alice);

    expect(joined).toEqual([alice, bob]);
    expect(left).toEqual([alice]);
    // Roster reflects the removals.
    expect(presence.members).toEqual([bob]);
  });
});

describe('createMockRealtime', () => {
  it('returns an assertable proxy', async () => {
    const mock = createMockRealtime();
    await mock.connection('main');
    // The proxy exposes an `$` assertable bookkeeper.
    expect(mock.$.wasCalled('connection')).toBe(true);
    expect(mock.$.wasCalledWith('connection', 'main')).toBe(true);
  });

  it('createMockRealtimeConnection returns an assertable proxy over a connection', () => {
    const conn = createMockRealtimeConnection();
    conn.channel('orders');
    expect(conn.$.wasCalledWith('channel', 'orders')).toBe(true);
  });
});
