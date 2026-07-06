# @academorix/realtime

Realtime transport + React hooks for the Academorix workspace. Wraps Laravel
Reverb via Laravel Echo + `pusher-js` (lazy-loaded so the initial bundle stays
small).

- Depends on `@academorix/core`.
- Peer-depends on `laravel-echo`, `pusher-js` (optional), and React 19.

## Public API

| Subpath                        | Exports                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `@academorix/realtime/client`  | `createRealtimeClient(config)`, `RealtimeClient`, `RealtimeChannel`, `RealtimeConfig`              |
| `@academorix/realtime/context` | `createRealtimeContext()` → `{ RealtimeProvider, useRealtimeClient }`                              |
| `@academorix/realtime/hooks`   | `useChannel(client, name, handlers)`, `usePrivateChannel(...)`, `usePresenceChannel<TMember>(...)` |
| `@academorix/realtime/refine`  | `createReverbLiveProvider(client)`, `createNoopLiveProvider()`, `LiveEvent`, `RefineLiveProvider`  |

Root barrel re-exports everything.

## Design principles

- **Lazy transport.** `laravel-echo` + `pusher-js` load on first channel
  subscription. Consumers that don't use realtime pay zero bytes.
- **Framework-agnostic core.** The client factory is plain JavaScript — React
  hooks + Refine adapter sit on top as optional layers.
- **SSR-safe.** Every hook and factory short-circuits when `window` is
  undefined.
- **Optional peer deps.** `laravel-echo` and `pusher-js` are declared as
  optional peer deps. Apps that use realtime install them; apps that don't stay
  minimal.

## Usage

### 1. Instantiate the client

```ts
// apps/dashboard/src/lib/realtime.ts
import { createRealtimeClient } from "@academorix/realtime/client";

import { envConfig } from "@/config/env.config";
import { tokenStore } from "@/lib/http";

export const realtimeClient = createRealtimeClient({
  appKey: envConfig.reverb.appKey,
  host: envConfig.reverb.host,
  port: envConfig.reverb.port,
  scheme: envConfig.reverb.scheme,
  authEndpoint: `${envConfig.apiUrl}/broadcasting/auth`,
  getAuthHeaders: () => {
    const token = tokenStore.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
```

### 2. Provide it through context

```tsx
import { createRealtimeContext } from "@academorix/realtime/context";
import { realtimeClient } from "@/lib/realtime";

export const { RealtimeProvider, useRealtimeClient } = createRealtimeContext();

// apps/dashboard/src/providers.tsx
<RealtimeProvider client={realtimeClient}>{children}</RealtimeProvider>;
```

### 3. Subscribe from anywhere

```tsx
import { useChannel, usePresenceChannel } from "@academorix/realtime/hooks";

function AttendanceLive({ sessionId }: { sessionId: string }) {
  const client = useRealtimeClient();

  useChannel(client, `session.${sessionId}.attendance`, {
    "attendance.marked": (payload) =>
      queryClient.invalidateQueries({ queryKey }),
  });

  const { members } = usePresenceChannel<Presence>(
    client,
    `session.${sessionId}`,
  );

  return <PresenceStrip members={members} />;
}
```

### 4. Bridge into Refine (dashboard only)

```tsx
import { createReverbLiveProvider } from "@academorix/realtime/refine";

<Refine
  liveProvider={createReverbLiveProvider(realtimeClient)}
  options={{ liveMode: "auto" }}
>
  ...
</Refine>;
```

## Auth flow

Private + presence channels authorise via a POST to `config.authEndpoint`
(usually `${apiUrl}/broadcasting/auth`). The `config.getAuthHeaders` callback is
invoked on every request so bearer-token rotation works without reconnecting.
