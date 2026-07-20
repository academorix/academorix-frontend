# @stackra/realtime

Multi-driver realtime WebSocket manager for the Stackra framework — transport-agnostic, driver-registered, with React hooks for channels and presence.

## Install

```bash
pnpm add @stackra/realtime @stackra/container @stackra/contracts @stackra/logger @stackra/support reflect-metadata
```

## Quick start

```typescript
import { RealtimeModule } from '@stackra/realtime';

@Module({
  imports: [
    RealtimeModule.forRoot({
      default: 'main',
      connections: {
        main: {
          driver: 'socketio',
          url: 'wss://api.example.com',
          autoConnect: true,
          reconnection: { enabled: true, delay: 1000, maxDelay: 30000 },
        },
      },
    }),

    // Drivers are registered separately — install a driver package
    // and pass its connector class here.
    RealtimeModule.forFeature('socketio', SocketIoConnector),
  ],
})
export class AppModule {}
```

## Public API

### Injection

```typescript
import { Inject, Injectable } from '@stackra/container';
import { REALTIME_MANAGER } from '@stackra/contracts';
import { RealtimeManager, InjectRealtimeManager } from '@stackra/realtime';

@Injectable()
class NotificationService {
  constructor(@InjectRealtimeManager() private realtime: RealtimeManager) {}

  async subscribe(orderId: string) {
    const conn = await this.realtime.connection();
    const channel = conn.channel(`orders.${orderId}`);
    channel.on('updated', (data) => {
      /* … */
    });
    channel.on('cancelled', (data) => {
      /* … */
    });
    return channel;
  }
}
```

### Channels

Three channel kinds:

```typescript
const conn = await realtime.connection();

// Public — any client can subscribe
const orders = conn.channel('orders');

// Private — requires auth handshake
const account = conn.privateChannel(`accounts.${userId}`);

// Presence — tracks who's online
const room = conn.presenceChannel(`room.${roomId}`);
room.here((members) => setUsers(members));
room.joining((m) => setUsers((prev) => [...prev, m]));
room.leaving((m) => setUsers((prev) => prev.filter((u) => u !== m)));
```

### Channel API

```typescript
channel.on(event, handler); // subscribe
channel.off(event, handler); // unsubscribe
channel.whisper(event, data); // client-only broadcast to other channel members
channel.leave(); // unsubscribe from the channel
```

### Connection lifecycle

```typescript
realtime.getDefaultDriver();
realtime.getConnectionNames();
await realtime.disconnect('main');
await realtime.disconnectAll();
```

## Drivers

Drivers are separate packages that implement `IRealtimeConnector`. None ship in the core to keep the runtime transport-agnostic.

Custom driver:

```typescript
import { Injectable } from '@stackra/container';
import type {
  IRealtimeConnector,
  IRealtimeConnection,
  IRealtimeConnectionConfig,
} from '@stackra/realtime';

@Injectable()
class MyDriverConnector implements IRealtimeConnector {
  async connect(config: IRealtimeConnectionConfig): Promise<IRealtimeConnection> {
    // Return an object that satisfies IRealtimeConnection.
  }
}

// Register at bootstrap
RealtimeModule.forFeature('my-driver', MyDriverConnector);
```

## Events

Every connection emits lifecycle events on the shared `EVENT_EMITTER` bus:

```typescript
import { REALTIME_EVENTS } from '@stackra/contracts';

events.on(REALTIME_EVENTS.CONNECTED, ({ connection }) => {});
events.on(REALTIME_EVENTS.DISCONNECTED, ({ connection, reason }) => {});
events.on(REALTIME_EVENTS.RECONNECTING, ({ connection, attempt }) => {});
events.on(REALTIME_EVENTS.ERROR, ({ connection, error }) => {});
events.on(REALTIME_EVENTS.MESSAGE, ({ connection, channel, event, data }) => {});
```

Drivers should call `manager.reportReconnecting(name, attempt)`, `manager.reportError(name, error)`, and `manager.reportMessage(name, channel, event, data)` so these events fire consistently — never directly emit to `EVENT_EMITTER` from the driver.

## React bindings — `@stackra/realtime/react`

```tsx
import { useRealtime, useChannel, usePresence } from '@stackra/realtime/react';

function OrderUpdates({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);

  useChannel(`orders.${orderId}`, 'updated', (data) => setOrder(data));
  useChannel(`orders.${orderId}`, 'cancelled', () => setOrder(null));

  return <OrderCard order={order} />;
}

function OnlineUsers({ roomId }: { roomId: string }) {
  const { members, connected } = usePresence(`room.${roomId}`);
  if (!connected) return <Spinner />;
  return <UserList users={members} />;
}

function Debug() {
  const rt = useRealtime();
  return <span>{rt.getConnectionNames().join(', ')}</span>;
}
```

## Testing helper — `@stackra/realtime/testing`

```typescript
import { createMockRealtime } from '@stackra/realtime/testing';

const rt = createMockRealtime();
await notifier.subscribe(orderId);
rt.$.assertCalled('connection').once();

// Drive inbound frames from a test to exercise consumer handlers
const conn = await rt.connection();
const orders = conn.channel(`orders.${orderId}`);
const handler = vi.fn();
orders.on('updated', handler);
conn.simulateIncoming(`orders.${orderId}`, 'updated', { status: 'shipped' });
expect(handler).toHaveBeenCalledWith({ status: 'shipped' });

// Presence channels support the same trick via simulateJoining / simulateLeaving
```

Every mock channel records whispers into `conn.whispers`, so assertions on
client-side broadcasts are one array away.

## Configuration

```bash
cp node_modules/@stackra/realtime/config/realtime.config.ts src/config/realtime.config.ts
```

## Subpaths

| Import                      | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `@stackra/realtime`         | Core `RealtimeModule`, `RealtimeManager`, decorators |
| `@stackra/realtime/react`   | `useRealtime`, `useChannel`, `usePresence`           |
| `@stackra/realtime/testing` | `createMockRealtime()`                               |

## License

MIT
