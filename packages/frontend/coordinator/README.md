# @stackra/coordinator

Cross-tab coordination for browser apps — leader election, distributed locks, and event relay across every open tab. Zero server dependency; uses Web Locks API and BroadcastChannel.

## Install

```bash
pnpm add @stackra/coordinator @stackra/container @stackra/contracts reflect-metadata
```

## Quick start

```typescript
import { CoordinatorModule } from '@stackra/coordinator';

@Module({
  imports: [
    CoordinatorModule.forRoot({
      channelName: 'my-app',
      heartbeatMs: 1000,
      staleThresholdMs: 3000,
      broadcastEvents: true,
      broadcastPatterns: ['auth:**', 'sync:**'],
      preferWebLocks: true,
      preferWebLocksElection: true,
      preferVisibleLeader: false,
    }),
  ],
})
export class AppModule {}
```

## Public API

### `TabCoordinator`

The elected-leader service. One tab per origin becomes the leader; others are followers.

```typescript
import { Inject, Injectable } from '@stackra/container';
import { TAB_COORDINATOR } from '@stackra/contracts';
import { TabCoordinator } from '@stackra/coordinator';

@Injectable()
class SyncService {
  constructor(@Inject(TAB_COORDINATOR) private coord: TabCoordinator) {}

  onModuleInit() {
    // Only the leader tab performs the expensive sync
    this.coord.onRoleChange((role) => {
      if (role === 'leader') this.startAutoSync();
      else this.stopAutoSync();
    });
  }
}
```

Runtime API:

```typescript
coord.isLeader(); // boolean
coord.getRole(); // 'leader' | 'follower'
coord.getTabId(); // this tab's UUID
coord.getLeaderId(); // leader's UUID or null
coord.getActiveTabs(); // ITabInfo[]
coord.getTabCount(); // number
coord.onRoleChange(cb); // subscribe
coord.resign(); // voluntary step-down
coord.destroy(); // cleanup
```

### `LockManager`

Cross-tab mutual exclusion. Uses Web Locks API when available with a localStorage-CAS fallback:

```typescript
import { InjectLockManager, LockManager } from '@stackra/coordinator';

@Injectable()
class AuthService {
  constructor(@InjectLockManager() private locks: LockManager) {}

  async refreshToken() {
    // Only one tab at a time refreshes the token
    return this.locks.run(
      'token-refresh',
      async () => {
        const token = await api.refresh();
        await cache.set('token', token);
        return token;
      },
      { timeoutMs: 10000 }
    );
  }
}

// Check if a lock is held (Web Locks only)
const busy = await locks.isLocked('token-refresh');
```

### `CoordinatorTransport`

Automatically bridges the `@stackra/events` bus across tabs. Events matching `broadcastPatterns` fire on every open tab as if they were emitted locally. No wiring needed beyond `broadcastEvents: true` in the module config.

## Cross-tab events

```typescript
import { COORDINATOR_EVENTS } from '@stackra/contracts';

events.on(COORDINATOR_EVENTS.LEADER_ELECTED, ({ tabId }) => {});
events.on(COORDINATOR_EVENTS.LEADER_RESIGNED, ({ tabId }) => {});
events.on(COORDINATOR_EVENTS.TAB_JOINED, ({ tabId }) => {});
events.on(COORDINATOR_EVENTS.TAB_LEFT, ({ tabId }) => {});
```

## React bindings — `@stackra/coordinator/react`

```tsx
import { useIsLeader, useTabCount } from '@stackra/coordinator/react';

function SyncIndicator() {
  const isLeader = useIsLeader();
  return isLeader ? <Badge>Syncing on this tab</Badge> : null;
}

function TabInfo() {
  const count = useTabCount();
  return <span>{count} tab(s) open</span>;
}
```

## Options

| Option                   | Default                              | Purpose                                                          |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| `channelName`            | `'stackra-coordinator'`              | BroadcastChannel name (isolates apps on the same origin)         |
| `heartbeatMs`            | `1000`                               | Leader liveness ping interval                                    |
| `staleThresholdMs`       | `3000`                               | Time after which the leader is considered dead                   |
| `broadcastEvents`        | `true`                               | Enable cross-tab event relay                                     |
| `broadcastPatterns`      | `['sync:**', 'auth:**', 'state:**']` | Wildcard patterns to relay                                       |
| `preferWebLocks`         | `true`                               | Use Web Locks API for distributed locks (fallback: localStorage) |
| `preferWebLocksElection` | `true`                               | Use Web Locks for leader election (fallback: heartbeat protocol) |
| `preferVisibleLeader`    | `false`                              | Prefer the visible/focused tab as leader                         |

## Election protocol

1. **Web Locks path** (default in modern browsers) — every tab requests the same named lock via `navigator.locks.request()`. The lock holder is the leader. Failover is instant when the leader closes.
2. **Heartbeat path** (fallback) — the leader broadcasts a heartbeat every `heartbeatMs`. If no heartbeat within `staleThresholdMs`, followers race to claim leadership. Tie-breaking is by `tabId` ordering.

## Configuration

```bash
cp node_modules/@stackra/coordinator/config/coordinator.config.ts src/config/coordinator.config.ts
```

## Testing helper — `@stackra/coordinator/testing`

```typescript
import { createMockCoordinator, createMockLockManager } from '@stackra/coordinator/testing';

// Coordinator starts as leader — flip roles to exercise both branches
const coordinator = createMockCoordinator();
expect(coordinator.isLeader()).toBe(true);
service.subscribeToRoleChanges(coordinator); // wires onRoleChange

coordinator.simulateRole('follower');
service.$.assertCalled('teardown').once();

coordinator.simulateRole('leader');
service.$.assertCalled('bootstrap').once();

// Lock manager — real promise-based serialisation, no real Web Locks
const locks = createMockLockManager();
const result = await locks.run('token-refresh', async () => 'new-token');
expect(result).toBe('new-token');
locks.$.assertCalled('run').with('token-refresh').once();
```

Neither mock touches `BroadcastChannel`, `navigator.locks`, or `localStorage`
— every operation runs in-process, so tests are deterministic and fast.

## Subpaths

| Import                         | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `@stackra/coordinator`         | `CoordinatorModule`, `TabCoordinator`, `LockManager`, decorators |
| `@stackra/coordinator/react`   | `useCoordinator`, `useIsLeader`, `useLock`                       |
| `@stackra/coordinator/testing` | `createMockCoordinator()`, `createMockLockManager()`             |

## License

MIT
