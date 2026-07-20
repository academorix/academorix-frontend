# @stackra/notifications

Enterprise multi-channel notification orchestrator for the Stackra framework —
Web Push subscription management, an in-app notification centre backed by
`@stackra/storage`, Expo native push token handling, permission management,
per-user preferences with quiet-hours + DND, snooze registry, priority-derived
HeroUI toast bridge, HeroUI Pro-based bell / drawer / row / preferences UI, and
a full testing subpath with in-memory mocks + assertable factories.

## What ships

- **Runtime (DI + React)** — `NotificationModule` binds a `NotificationManager`
  (channel dispatch orchestrator), an `InAppNotificationCentre` (durable queue
  backed by `@stackra/storage`), a `NotificationPreferencesService` (per-user
  category × channel matrix + quiet hours), a shared `PushSubscriptionManager`
  (platform adapters wired by `PushModule` on web or `NativeNotificationModule`
  on native), the built-in `InAppChannelDriver`, and the fail-soft
  `AnalyticsBridgeService`.
- **HeroUI Pro components (web)** — `NotificationBell`, `NotificationDrawer`,
  `NotificationList`, `NotificationRow`, `NotificationEmptyState`,
  `NotificationBadge`, `PushPermissionBanner`, `ChannelToggle`,
  `QuietHoursPicker`, `CategoryPreferencesPanel`. Plus two full-page routes:
  `InboxPage` and `NotificationPreferencesPage`.
- **HeroUI Native components (native)** — a lean starting set
  (`NotificationBell`) that binds against the same DI-registered manager +
  centre. The web hooks translate 1:1 to native — HeroUI Native is the visual
  layer, the framework layer is shared.
- **React hooks** — `useInAppNotifications`, `useNotificationCentre`,
  `useNotificationActions`, `useNotificationPermission`, `usePushSubscription`,
  `useNotificationPreferences`, `useNotificationToast`, `useNotificationWrites`,
  `useRenderableNotifications`, `useSnoozeStore` — every reader over the DI
  singleton via `useSyncExternalStore` for tearing-free reads under concurrent
  React.
- **Adapter pattern** — one `IPushSubscriptionAdapter` contract, two
  implementations (`WebPushAdapter` bound by `PushModule`,
  `ExpoPushTokenAdapter` bound by `NativeNotificationModule`). Both plug into a
  single platform-agnostic `PushSubscriptionManager` in core.
- **OS-level dispatch** — `WebNotificationChannelDriver` (fires
  `new Notification(...)`) and `ExpoNotificationChannelDriver` (fires
  `scheduleNotificationAsync` with `trigger: null`) both register on the manager
  under `id = 'os-notification'` automatically.
- **Testing** — `MockNotificationManager`, `MockInAppNotificationCentre`,
  `MockPushSubscriptionAdapter`, `MockPushSubscriptionManager`,
  `MockNotificationPreferences`, `MockSnoozeStore`, plus `createMock*`
  assertable factories in `@stackra/notifications/testing`.

## Install

```bash
pnpm add @stackra/notifications @stackra/container @stackra/contracts \
         @stackra/storage @stackra/support reflect-metadata
# React bindings + HeroUI-based components:
pnpm add @stackra/ui react
# Web Push (browser):
# No extra dep — @stackra/notifications/push wires the Web Push adapter.
# Native Push (Expo):
pnpm add expo-notifications
```

## Bootstrap — web

```typescript
import { Module } from "@stackra/container";
import { WebStorageModule } from "@stackra/storage";
import { AnalyticsModule } from "@stackra/analytics";
import { NotificationModule } from "@stackra/notifications";

@Module({
  imports: [
    WebStorageModule.forRoot({
      default: "localStorage",
      stores: { localStorage: { driver: "localStorage" } },
    }),
    AnalyticsModule.forRoot({
      providers: { ga4: { driver: "ga4", measurementId: "G-XXXXXX" } },
    }),
    NotificationModule.forRoot({
      centre: { storage: "localStorage", maxItems: 200 },
      // When `push` is supplied, `NotificationModule.forRoot` transitively
      // imports `PushModule.forRoot(push)` — one entry point wires both.
      push: { vapidPublicKey: import.meta.env.VITE_VAPID_KEY as string },
    }),
  ],
})
export class AppModule {}
```

## Bell + drawer

```tsx
import { NotificationBell } from "@stackra/notifications/react";

function Header() {
  return (
    <header className="flex items-center gap-2 p-4">
      {/* … the rest of the toolbar … */}
      <NotificationBell />
    </header>
  );
}
```

The bell owns the drawer's open state internally. Consumers who want an external
trigger use the drawer directly:

```tsx
import { NotificationDrawer } from "@stackra/notifications/react";

function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open notifications</button>
      <NotificationDrawer
        isOpen={open}
        onOpenChange={setOpen}
        onOpenPreferences={() => navigate("/notifications/preferences")}
      />
    </>
  );
}
```

## Preferences page

```tsx
import { NotificationPreferencesPage } from "@stackra/notifications/react";

// Route at /notifications/preferences
function PreferencesRoute() {
  return (
    <NotificationPreferencesPage
      writer={{
        updatePreferences: async (next) => {
          await api.put("/notifications/preferences", next);
        },
      }}
    />
  );
}
```

The page composes:

1. Push section (permission state + browser-specific re-enable copy).
2. Global do-not-disturb switch (folds into `defaults.do_not_disturb`).
3. Quiet-hours picker (`QuietHoursPicker` + `Clear`).
4. Category × channel matrix (`CategoryPreferencesPanel`).
5. Save button (fires the caller-supplied `writer.updatePreferences(...)`).

## Custom channel driver

```typescript
import { Injectable } from "@stackra/container";
import {
  NotificationModule,
  type INotificationChannelDriver,
  type INotificationPayload,
} from "@stackra/notifications";

@Injectable()
class SlackChannelDriver implements INotificationChannelDriver {
  public readonly id = "slack";
  public async deliver(payload: INotificationPayload): Promise<void> {
    await fetch("https://hooks.slack.com/...", {
      method: "POST",
      body: JSON.stringify({ text: `${payload.title}\n${payload.body ?? ""}` }),
    });
  }
}

@Module({
  imports: [NotificationModule.forFeature(SlackChannelDriver)],
})
export class SlackModule {}

// Later, dispatch through the shared manager:
await manager.dispatch(
  { title: "Deploy succeeded" },
  { channels: ["in-app", "slack"] },
);
```

## Web Push subscription flow

```tsx
import { usePushSubscription } from "@stackra/notifications/react";
import { Button } from "@stackra/ui/react";

function PushToggle() {
  const { subscription, subscribe, unsubscribe, isPending } =
    usePushSubscription({
      vapidPublicKey: import.meta.env.VITE_VAPID_KEY as string,
    });
  return (
    <Button
      isDisabled={isPending}
      onPress={async () => {
        if (subscription) {
          await unsubscribe();
          await api.delete("/push/subscribe");
        } else {
          const sub = await subscribe();
          if (sub) await api.post("/push/subscribe", sub.value);
        }
      }}
    >
      {subscription ? "Disable push" : "Enable push"}
    </Button>
  );
}
```

## Native (Expo)

```typescript
import { Module } from "@stackra/container";
import { NativeStorageModule } from "@stackra/storage/native";
import { NativeNotificationModule } from "@stackra/notifications/native";

@Module({
  imports: [
    NativeStorageModule.forRoot({
      default: "asyncStorage",
      stores: { asyncStorage: { driver: "asyncStorage" } },
    }),
    NativeNotificationModule.forRoot({
      centre: { storage: "asyncStorage", maxItems: 200 },
      push: { projectId: "00000000-0000-0000-0000-000000000000" },
    }),
  ],
})
export class AppModule {}
```

`NativeNotificationModule` binds the {@link ExpoPushTokenAdapter} under
`PUSH_SUBSCRIPTION_ADAPTER`, so the shared `PushSubscriptionManager` in core
works uniformly on native. It also auto-registers the
`ExpoNotificationChannelDriver` under `id = 'os-notification'` — dispatching
with `channels: ['in-app', 'os-notification']` fires both an in-app entry and an
OS-level `scheduleNotificationAsync` call.

## Testing

```typescript
import { Container } from "@stackra/container";
import {
  createMockPushSubscriptionAdapter,
  createMockNotificationManager,
  createMockNotificationPreferences,
  mockNotificationPayload,
} from "@stackra/notifications/testing";
import {
  PUSH_SUBSCRIPTION_ADAPTER,
  NOTIFICATION_MANAGER,
} from "@stackra/notifications";

const adapter = createMockPushSubscriptionAdapter({ platform: "web" });
const manager = createMockNotificationManager({
  permission: { supported: true, permission: "granted" },
});
const preferences = createMockNotificationPreferences();

const app = new Container();
app.register(PUSH_SUBSCRIPTION_ADAPTER, { useValue: adapter });
app.register(NOTIFICATION_MANAGER, { useValue: manager });
// …

await manager.dispatch(mockNotificationPayload({ title: "Hello" }));
expect(manager.$.wasCalled("dispatch")).toBe(true);
```

## Analytics events

Every state change flows through the optional `IAnalyticsManager`
(`ANALYTICS_MANAGER` token from `@stackra/contracts`). Consumers who ship
`@stackra/analytics` at the app root receive every event automatically — no
adapter provider needed.

| Event                                          | When it fires                                                                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `notifications.permission.requested`           | `manager.requestPermission()` is invoked.                                                                                                                                                                          |
| `notifications.permission.granted`             | The user granted notification permission.                                                                                                                                                                          |
| `notifications.permission.denied`              | The user denied notification permission.                                                                                                                                                                           |
| `notifications.in_app.dispatched`              | A payload was enqueued in the in-app centre.                                                                                                                                                                       |
| `notifications.in_app.seen`                    | The user marked an in-app entry as seen.                                                                                                                                                                           |
| `notifications.in_app.dismissed`               | The user dismissed a single in-app entry.                                                                                                                                                                          |
| `notifications.in_app.cleared`                 | The user cleared the entire in-app centre.                                                                                                                                                                         |
| `notifications.web_push.subscribed`            | A Web Push subscription completed successfully.                                                                                                                                                                    |
| `notifications.web_push.unsubscribed`          | A Web Push subscription was cancelled.                                                                                                                                                                             |
| `notifications.web_push.subscription_failed`   | A Web Push `subscribe(...)` call threw.                                                                                                                                                                            |
| `notifications.native_push.token_obtained`     | The Expo push token was retrieved.                                                                                                                                                                                 |
| `notifications.native_push.token_failed`       | Expo push token retrieval failed.                                                                                                                                                                                  |
| `notifications.channel.registered`             | A channel driver was registered via `manager.register(...)`.                                                                                                                                                       |
| `notifications.delivery.succeeded`             | A driver delivered a payload without throwing.                                                                                                                                                                     |
| `notifications.delivery.failed`                | A driver's `deliver(payload)` promise rejected.                                                                                                                                                                    |
| `notifications.preferences.changed`            | The preferences snapshot mutated (`set` / `patch` / `setChannelEnabled` / `setQuietHours` / `clearQuietHours`). Payload: `{ field: 'defaults' \| 'quiet_hours' \| 'per_child', changedKeys?: readonly string[] }`. |
| `notifications.preferences.channel_enabled`    | `setChannelEnabled(cat, ch, true)` flipped a channel ON (transition only, skipped on mandatory-on pairs). Payload: `{ category, channel }`.                                                                        |
| `notifications.preferences.channel_disabled`   | `setChannelEnabled(cat, ch, false)` flipped a channel OFF (transition only, skipped on mandatory-on pairs). Payload: `{ category, channel }`.                                                                      |
| `notifications.preferences.quiet_hours_active` | `isInQuietHours()` transitioned from `false` to `true` on this service instance. Payload: `{ start, end, timezone }`.                                                                                              |

## License

MIT © Stackra L.L.C
