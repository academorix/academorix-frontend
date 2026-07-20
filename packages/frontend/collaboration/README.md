# @stackra/collaboration

Liveblocks-style real-time collaboration for the Stackra framework — presence,
cursors, threads, shared state, and notifications with pluggable transports
(BroadcastChannel, Laravel Reverb, mock).

## Install

```bash
pnpm add @stackra/collaboration @stackra/container @stackra/contracts @stackra/logger reflect-metadata
```

Optional peer for cross-network transport:

```bash
pnpm add @stackra/realtime
```

## Quick start

```typescript
import { CollaborationModule } from "@stackra/collaboration";

@Module({
  imports: [
    // 'broadcast' — same-origin tabs only, no server (BroadcastChannel)
    // 'reverb'    — Laravel Reverb backend via @stackra/realtime
    // 'auto'      — tries Reverb, falls back to BroadcastChannel
    CollaborationModule.forRoot({ transport: "broadcast" }),
  ],
})
export class AppModule {}
```

## React hooks — all-in-one

The primary surface is a set of React hooks. Each hook opens the room lazily on
mount and cleans up on unmount:

```tsx
import {
  useRoom,
  useCursors,
  useTypingIndicator,
  useSharedState,
  useThreads,
  useNotifications,
  useActivityFeed,
} from "@stackra/collaboration";
```

### `useRoom`

Join a room by id. Returns the current member list plus join/leave callbacks.

```tsx
function DocumentEditor({ docId, currentUser }) {
  const { members, leave } = useRoom(`doc-${docId}`, {
    self: currentUser,
    metadata: { role: "editor" },
  });

  return (
    <>
      <MemberList members={members} />
      <Editor docId={docId} />
      <button onClick={leave}>Leave</button>
    </>
  );
}
```

### `useCursors`

Broadcast and observe cursor positions:

```tsx
function CollaborativeCanvas({ docId }) {
  const { cursors, setCursor } = useCursors(`doc-${docId}`);

  return (
    <div onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}>
      {cursors.map((c) => (
        <Cursor
          key={c.member.id}
          x={c.position.x}
          y={c.position.y}
          name={c.member.name}
        />
      ))}
    </div>
  );
}
```

### `useTypingIndicator`

Emit and observe "user is typing" signals:

```tsx
function ChatInput({ roomId, threadId }) {
  const { typing, startTyping, stopTyping } = useTypingIndicator(
    roomId,
    threadId,
  );

  return (
    <>
      <input onFocus={startTyping} onBlur={stopTyping} />
      {typing.length > 0 && (
        <span>{typing.map((m) => m.name).join(", ")} typing…</span>
      )}
    </>
  );
}
```

### `useSharedState`

Room-scoped state that syncs across members. Any member can read, but only the
room owner (configurable) can write:

```tsx
function ScoreCard({ roomId }) {
  const [score, setScore] = useSharedState(roomId, "score", 0);

  return (
    <>
      <span>{score}</span>
      <button onClick={() => setScore(score + 1)}>+1</button>
    </>
  );
}
```

### `useThreads`

Comment threads with replies and resolve state:

```tsx
function CommentsSidebar({ docId }) {
  const { threads, createThread, replyToThread, resolveThread } = useThreads(
    `doc-${docId}`,
  );

  return (
    <ul>
      {threads.map((t) => (
        <li key={t.id}>
          <p>{t.rootMessage.body}</p>
          {t.replies.map((r) => (
            <p key={r.id}>↳ {r.body}</p>
          ))}
          <button onClick={() => resolveThread(t.id)}>resolve</button>
        </li>
      ))}
    </ul>
  );
}
```

### `useNotifications`

Room-scoped notification stream:

```tsx
function NotificationBell({ roomId }) {
  const { notifications, unread, markAsRead } = useNotifications(roomId);
  return <Bell count={unread.length} />;
}
```

### `useActivityFeed`

Aggregated activity log — every thread create, resolve, and reply becomes a feed
entry:

```tsx
function ActivitySidebar({ roomId }) {
  const feed = useActivityFeed(roomId);
  return <FeedList entries={feed} />;
}
```

## Transports

| Transport   | Use when                                | Requires                                |
| ----------- | --------------------------------------- | --------------------------------------- |
| `broadcast` | Same-origin tabs only, no server        | Nothing extra                           |
| `reverb`    | Multi-user, multi-device, network-scale | `@stackra/realtime` + a Reverb backend  |
| `mock`      | Tests                                   | Nothing — records every message locally |

Custom transport:

```typescript
import type { CollaborationTransport } from "@stackra/collaboration";

class MyTransport implements CollaborationTransport {
  connect(roomId: string) {
    /* ... */
  }
  disconnect(roomId: string) {
    /* ... */
  }
  publish(roomId: string, type: string, payload: unknown) {
    /* ... */
  }
  subscribe(roomId: string, handler: (msg) => void) {
    /* ... */
  }
}
```

Register it via `CollaborationModule.forFeature('my-transport', MyTransport)`.

## Wire events

```typescript
import { COLLABORATION_EVENTS } from "@stackra/contracts";

events.on(
  COLLABORATION_EVENTS.CURSOR_MOVE,
  ({ roomId, member, position }) => {},
);
events.on(COLLABORATION_EVENTS.CURSOR_REMOVE, ({ roomId, memberId }) => {});
events.on(
  COLLABORATION_EVENTS.TYPING_START,
  ({ roomId, member, threadId }) => {},
);
events.on(
  COLLABORATION_EVENTS.TYPING_STOP,
  ({ roomId, member, threadId }) => {},
);
events.on(COLLABORATION_EVENTS.THREAD_CREATE, ({ roomId, thread }) => {});
events.on(
  COLLABORATION_EVENTS.THREAD_REPLY,
  ({ roomId, threadId, message }) => {},
);
events.on(
  COLLABORATION_EVENTS.THREAD_RESOLVE,
  ({ roomId, threadId, resolvedBy }) => {},
);
events.on(COLLABORATION_EVENTS.THREAD_DELETE, ({ roomId, threadId }) => {});
```

## Testing helper — `@stackra/collaboration/testing`

```typescript
import { createMockRoomManager } from "@stackra/collaboration/testing";

const rooms = createMockRoomManager();
const transport = rooms.getTransport();

// Connect the current user
await transport.connect("doc-42", "user-1", {
  name: "Alice",
  color: "#e74c3c",
});
expect(transport.getMembers("doc-42")).toHaveLength(1);

// Simulate an external member joining — fires every onMemberJoin listener
transport.simulateMemberJoin("doc-42", {
  userId: "user-2",
  name: "Bob",
  color: "#3498db",
  joinedAt: Date.now(),
  presence: {},
});

// Fluent assertion on broadcasts
transport.broadcast("doc-42", "cursor", { x: 100, y: 200 });
transport.$.assertCalled("broadcast")
  .with("doc-42", "cursor", { x: 100, y: 200 })
  .once();

// Or introspect the recorded ledger
expect(transport.broadcasts).toHaveLength(1);
```

The mock transport fully implements `CollaborationTransport` — presence,
broadcasts, and shared state all round-trip in-process without any
BroadcastChannel or Reverb backend.

## Subpaths

| Import                           | Purpose                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `@stackra/collaboration`         | `CollaborationModule`, `RoomManager`, hooks, decorators         |
| `@stackra/collaboration/testing` | `createMockRoomManager()`, `createMockCollaborationTransport()` |

## License

MIT
