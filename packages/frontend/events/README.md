# @stackra/events

Client-side, framework-agnostic event bus for the Stackra framework. Wildcard
patterns, wildcard listeners, typed emitter maps, and a per-listener
error-handling policy.

## Install

```bash
pnpm add @stackra/events @stackra/container @stackra/contracts reflect-metadata
```

## Quick start

```typescript
import { Module } from "@stackra/container";
import { EventEmitterModule } from "@stackra/events";

@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
      wildcard: true,
      delimiter: ".",
      maxListeners: 20,
      suppressErrors: true,
    }),
  ],
})
export class AppModule {}
```

## Public API

### Injection

```typescript
import { Injectable, Inject } from "@stackra/container";
import { EVENT_EMITTER } from "@stackra/contracts";
import type { IEventEmitter } from "@stackra/contracts";

@Injectable()
class OrdersService {
  constructor(@Inject(EVENT_EMITTER) private events: IEventEmitter) {}

  async place(order: Order) {
    await this.events.emit("order.created", order);
  }
}
```

### Emitting

```typescript
// Async emission (awaits every listener, propagates errors according to suppressErrors)
await events.emit("user.created", user);
await events.emit("order.line.added", { orderId, sku });

// Sync emission — fire-and-forget
events.emitSync("metric.recorded", { name: "clicks", value: 1 });
```

### Subscribing

```typescript
// Exact match
events.on("user.created", (user) => {
  /* … */
});

// Wildcard — `*` matches one segment, `**` matches many
events.on("user.**", (payload) => {
  /* every user event */
});
events.on("order.*.added", (payload) => {
  /* order.line.added, order.tag.added */
});

// One-shot
events.once("startup.complete", () => {
  /* … */
});

// Unsubscribe
const unsubscribe = events.on("foo", handler);
unsubscribe();
```

### Wildcard patterns

Wildcards use the `delimiter` from config (default `.`):

| Pattern        | Matches                                                              |
| -------------- | -------------------------------------------------------------------- |
| `user.created` | Exact                                                                |
| `user.*`       | `user.created`, `user.deleted` — one segment                         |
| `user.**`      | `user.created`, `user.profile.updated`, everything under `user`      |
| `**.error`     | `db.error`, `worker.retry.error` — one or more segments then `error` |

### Typed emitter — `@stackra/events` type parameter

```typescript
import type { IEventEmitter } from "@stackra/contracts";

type AppEvents = {
  "user.created": User;
  "order.paid": { orderId: string; amount: number };
};

const events = getEmitter<IEventEmitter<AppEvents>>();
await events.emit("user.created", user); // ✓ typed
await events.emit("order.paid", { orderId, amount }); // ✓ typed
await events.emit("user.created", 42); // ✗ compile error
```

### `@stackra/events/react` — React bindings

```tsx
import { useEvent, useEmit } from "@stackra/events/react";

function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEvent("order.created", (order: Order) => setOrders((o) => [...o, order]));

  return (
    <ul>
      {orders.map((o) => (
        <li key={o.id}>{o.total}</li>
      ))}
    </ul>
  );
}

function CreateOrderButton() {
  const emit = useEmit();
  return (
    <button onClick={() => emit("order.create-requested")}>New order</button>
  );
}
```

### Testing helper — `@stackra/events/testing`

```typescript
import { createMockEvents } from "@stackra/events/testing";

const events = createMockEvents();
await orders.place(order);

// Fluent assertion DSL
events.$.assertCalled("emit").with("order.created", order).once();

// Or introspect the recorded ledger directly
expect(events.emittedEvents).toHaveLength(1);
expect(events.getEmitsFor("order.created")[0]?.payload).toEqual(order);
```

The mock fully implements `IEventEmitter` — `on()` subscriptions fire on
`emit()`, `eventNames()` / `listenerCount()` reflect real subscription state,
and `removeAllListeners()` clears them.

## Error handling

Configure how listener errors propagate:

| `suppressErrors` | Behavior                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `true` (default) | Errors from listeners are caught and logged. `emit` never throws. |
| `false`          | First listener error propagates to the caller.                    |

Per-listener override:

```typescript
events.on("critical.event", handler, { suppressErrors: false });
```

## Cross-tab relay

Pair with `@stackra/coordinator` to broadcast selected event patterns to every
open tab via `BroadcastChannel`:

```typescript
CoordinatorModule.forRoot({
  broadcastEvents: true,
  broadcastPatterns: ["auth:**", "sync:**"], // only these relay
});
```

## Configuration

```bash
cp node_modules/@stackra/events/config/events.config.ts src/config/events.config.ts
```

## Subpaths

| Import                    | Purpose                               |
| ------------------------- | ------------------------------------- |
| `@stackra/events`         | Core `EventEmitterModule`, decorators |
| `@stackra/events/react`   | `useEvent`, `useEmit`                 |
| `@stackra/events/testing` | `createMockEvents()`                  |

## License

MIT
