# Academorix Dashboard — Notifications Plan

> Status: **draft** · Last review: 2026-07 · Owner: platform team.
>
> How Academorix delivers notifications across three surfaces: in-app (React),
> Web Push (browser + PWA background), and native OS (Tauri desktop). This
> document defines the transport, the delivery contract, the permission UX, the
> notification center panel, and every edge case (offline, focused, unfocused,
> do-not-disturb, quiet hours).

---

## 1. Surfaces + transports at a glance

```
┌──────────────────────────────────────────────────────────────────────┐
│                       BACKEND EVENT SOURCE                           │
│  Laravel + Reverb (Pusher-compatible WS) — one event = one payload   │
└─────────────┬──────────────────────────┬─────────────────────────────┘
              │                          │
        ┌─────▼──────┐            ┌──────▼──────┐
        │  Reverb    │            │  Web Push   │  ← for offline / closed
        │  WebSocket │            │  (VAPID)    │    app / mobile home
        │  (live)    │            │  server     │    screen delivery
        └─────┬──────┘            └──────┬──────┘
              │                          │
              │                          │
   ┌──────────▼──────────┐    ┌──────────▼──────────────┐
   │  Renderer (React)   │    │  Service Worker         │
   │  · toast            │    │  push event handler     │
   │  · badge count      │    │  → OS notification      │
   │  · center panel     │    │  → click → focus tab    │
   └──────────┬──────────┘    │  → close  → mark read   │
              │               └──────────┬──────────────┘
              │                          │
              └────────────┬─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Native OS  │  ← on Tauri desktop, mirror
                    │  (Tauri)    │    web push events into
                    │             │    Notification Center /
                    │             │    Action Center / DBus.
                    └─────────────┘
```

Three surfaces, one **canonical `Notification` DTO**:

```ts
interface Notification {
  id: string; // ULID from backend
  tenantId: string;
  recipientId: string;
  type: NotificationType; // 'attendance.missing', 'invoice.paid', …
  title: string; // localized backend-side per recipient
  body: string; // localized backend-side
  actionUrl?: string; // where to route on click
  category: "operational" | "billing" | "safety" | "marketing" | "system";
  createdAt: string; // ISO-8601
  readAt: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  icon?: string; // absolute URL to icon asset
  image?: string; // hero image (optional)
  data?: Record<string, unknown>; // free-form
}
```

Everything below is a delivery mechanism for this shape.

---

## 2. Delivery matrix

| Recipient state                 |       Reverb WS delivery       | Web Push delivery |           Native OS delivery           |
| ------------------------------- | :----------------------------: | :---------------: | :------------------------------------: |
| App foreground + tab focused    |          in-app toast          |    suppressed     |    suppressed (if desktop, silent)     |
| App foreground + tab blurred    | in-app toast + tab title flash | fires (fallback)  | native (unless desktop app is focused) |
| App background (tab open)       |        live but silent         |       fires       |                 native                 |
| App closed (browser or desktop) |              none              |       fires       |   fires when app running as service    |
| No network                      |    queue in-app once online    |       none        |                  none                  |
| Do-not-disturb / quiet hours    |        queue + coalesce        |    suppressed     |               suppressed               |

The renderer is authoritative when it's online — anywhere else, the service
worker is.

---

## 3. Permissions — the UX contract

We **never** ask for `Notification.permission` on first load. Silent
auto-prompts have 3-5% grant rates and burn goodwill.

Instead:

1. **Explicit request from the notification center panel**: a banner reading
   "Get instant updates. **Enable notifications**" appears the first time the
   panel is opened. Click → prompt.
2. **Contextual request** at the end of onboarding (see `ONBOARDING_PLAN.md`):
   "Notify me when a coach checks in / payment fails / lead comes in" — Yes /
   Not now.
3. **Never** show a modal blocking the app for permission.
4. **Once denied**, we surface a Settings → Notifications page with instructions
   for re-enabling per-browser + a **Test notification** button.

Permission states we track:

```ts
type PermissionState = "default" | "granted" | "denied" | "unsupported";
```

`unsupported` is set when
`!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)`.
Silently degrades to in-app + email.

---

## 4. Backend contract

### 4.1 Enqueue endpoint

- `POST /api/v1/notifications` — internal only, called from backend jobs.
- Body: the `Notification` DTO minus `id`, `createdAt`, `readAt`. Response: the
  persisted row.

### 4.2 Subscribe endpoint (Web Push)

- `POST /api/v1/notifications/push-subscriptions`
- Body: browser-produced `PushSubscription` JSON + client metadata (user agent,
  tenant, locale).
- Response: `{ id, expiresAt }`.
- Idempotent on the endpoint URL.

### 4.3 Unsubscribe endpoint

- `DELETE /api/v1/notifications/push-subscriptions/{id}`
- Called when the user disables notifications in Settings OR when the service
  worker's `pushsubscriptionchange` event fires.

### 4.4 List endpoint

- `GET /api/v1/notifications?read=unread&category=operational&cursor=…`
- Refine-friendly with `_page`, `_limit`, `_sort`, standard 6× filter params.
- Returns paginated `Notification[]`.

### 4.5 Bulk mark endpoint

- `PATCH /api/v1/notifications/bulk` — body `{ ids: string[], readAt: string }`
  or `{ all: true, before: string }`.

### 4.6 Reverb channels

- **Presence channel** per user: `presence-user.{userId}`. Reverb fires a
  `notifications.created` event; renderer subscribes on login, unsubscribes on
  logout.
- **Presence channel** per tenant scope: `presence-tenant.{tenantId}` — used
  only for broadcast operational alerts (system-wide maintenance).

### 4.7 VAPID keys

- Generated once per environment. Kept in Doppler
  (`academorix-dashboard/prd/VAPID_PUBLIC_KEY`, `…/VAPID_PRIVATE_KEY`).
- Public key exposed on `GET /api/v1/config/vapid` (no auth required — public by
  design).
- Backend uses `web-push` (Node) or `minishlink/web-push` (PHP) to deliver.

---

## 5. Renderer implementation

### 5.1 Files

```
src/notifications/
  index.ts                      barrel
  notification.types.ts         canonical Notification shape + enums
  notification.provider.tsx     React context (subscribe/unsubscribe, queue)
  notification.center.tsx       drawer/popover panel (HeroUI Drawer + List)
  notification.toast.tsx        in-app toast bridge (HeroUI toast + category variants)
  notification.badge.tsx        unread badge component (nav bar bell)
  permission.hook.ts            usePushPermission() with request UX
  push-subscription.ts          subscribe/unsubscribe against /api endpoints
  transport/
    reverb-transport.ts         subscribes to the Reverb channels
    push-transport.ts           service worker push registration
  reducers/
    notification.reducer.ts     read/unread state, coalesce, filters
```

### 5.2 Provider

Mounted in `src/providers.tsx` immediately after Refine so `useGetIdentity()`
resolves the current user. Owns:

- The unread queue (bounded LRU of ~200 items).
- The subscription lifecycle (subscribe on identity resolve → unsubscribe on
  logout / identity change).
- Reverb channel lease (auto-reconnect on visibility change).
- Broadcast to toast + badge + panel via React context.

### 5.3 In-app toast

- Success (invoice paid, coach checked in) → `toast.success`.
- Warning (attendance missing, payment retry) → `toast()`.
- Error (safeguarding alert, system) → `toast.danger`.
- Every toast has an **Open** action opening the `actionUrl`.
- Timeout: 6 s low/normal, 12 s high, 0 (persist) for `urgent`.

### 5.4 Notification center panel

- Right-side HeroUI `Drawer`, opens from the navbar bell.
- Sections: **Unread** (default), **All**, per-category filter chips.
- Actions per row: click → route, **Mark as read** / **Mark as unread**,
  **Snooze** dropdown (1h / 3h / tomorrow / next week).
- Bulk actions: **Mark all as read**, **Clear read**.
- Empty state: "You're all caught up 🎉" with a link to notification
  preferences.
- Infinite scroll via `useInfiniteQuery`.

### 5.5 Badge

- Navbar bell shows an unread count (max shown "99+").
- The dock/taskbar badge (native only) syncs via
  `tauri::app::App::set_badge_count` when running as desktop.

---

## 6. Service worker

### 6.1 push handler

```ts
// src/pwa/sw/push-handler.ts (imported into the generated SW via injectManifest
// or, more likely, kept as a runtime file we hook when we migrate strategies)
self.addEventListener("push", (event) => {
  const payload = event.data?.json() as Notification | undefined;
  if (!payload) return;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? "/pwa-192x192.png",
      image: payload.image,
      badge: "/favicon.svg",
      tag: payload.type, // coalesce like-kind (same tag replaces)
      data: { id: payload.id, url: payload.actionUrl },
      requireInteraction: payload.priority === "urgent",
      timestamp: new Date(payload.createdAt).getTime(),
    }),
  );
});
```

### 6.2 click handler

```ts
self.addEventListener("notificationclick", (event) => {
  const url = event.notification.data?.url ?? "/";
  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const client = clients.find((c) => c.url.includes("academorix"));

      if (client) {
        await client.focus();
        client.postMessage({ type: "notification:click", url });
      } else {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
```

### 6.3 close handler

Fire-and-forget `POST /api/v1/notifications/{id}/dismissed` so we can tune
signal quality (which notifications users close without opening).

### 6.4 pushsubscriptionchange handler

Re-subscribe against the backend when the push endpoint rotates. Called by the
browser transparently.

### 6.5 Integration with vite-plugin-pwa

We currently use `strategies: 'generateSW'`. Push handling requires custom code,
so we migrate to `strategies: 'injectManifest'`. Trade-off documented in
`src/config/pwa.config.ts` — kept behind a phase-2 flag so the initial ship uses
the simpler generator.

---

## 7. Native (Tauri) integration

When running inside Tauri:

1. `Notification` browser API is monkey-patched at boot to route through
   `tauri-plugin-notification::sendNotification` — same code, native delivery.
2. The service worker still runs (WKWebView / WebView2 both support it), but its
   `showNotification()` calls transparently render as native OS notifications.
3. The Reverb WebSocket runs in the renderer and dispatches to the Rust side
   over IPC when the app is unfocused, so notifications can be shown even if the
   JS event loop is throttled by the OS.

Deep-linking on click uses the same `academorix://` protocol handler wired up in
`DESKTOP_PLAN.md` §4.5.

---

## 8. Categories + user preferences

`Settings → Notifications` (part of the Settings module scaffolded in Phase 4a)
exposes:

| Category                           | Channels the user can toggle                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Operational (attendance, sessions) | In-app · Push · Email · Digest                                                   |
| Billing (invoices, payments)       | In-app · Push · Email                                                            |
| Safety (safeguarding alerts)       | In-app · Push · Email (**Push always on** for safeguarding — cannot be disabled) |
| Marketing / product                | In-app · Email · Digest                                                          |
| System (maintenance)               | In-app · Push                                                                    |

**Quiet hours** — user-set 22:00-07:00 window. Push suppressed during quiet
hours; in-app still delivers. Backend caches suppressed pushes and delivers a
digest at the top of the next active window.

**Do-not-disturb** — a global switch in the navbar (part of the profile
popover). Suppresses everything except `urgent` safety alerts.

---

## 9. Testing strategy

- **Unit**: reducer + subscription lifecycle + permission hook mocked against
  fake Reverb + push transports.
- **Integration**: a mock service worker registered via MSW's `msw/browser` in
  Playwright. Fires synthetic push events at the SW.
- **Manual smoke**:
  - Chrome desktop, Firefox desktop, Safari 16.4+ (macOS + iOS 16.4+ home-screen
    PWA).
  - Edge 100+ on Windows with WebView2.
  - Tauri desktop on macOS + Windows + Linux.
- **Feature parity matrix** kept next to this doc; updated per release.

---

## 10. Analytics

Events emitted (see `src/config/analytics.config.ts`):

- `notification_shown` — every render surface (in-app, push, native).
- `notification_clicked` — user opened it.
- `notification_dismissed` — closed without opening.
- `notification_permission_requested` / `_granted` / `_denied`.
- `push_subscription_created` / `_renewed` / `_revoked`.
- `notification_center_opened`.
- `notification_snoozed`.

Emitted with `{ category, type, priority, source }` so we can slice signal
quality by category.

---

## 11. Rollout — 4 phases

### Phase 1 — In-app only (1 week)

- Ship the notification center panel, badge, in-app toasts.
- Reverb channel subscription per user.
- No push, no native. Every notification stays in-app.
- Green light: badge counts are correct, click → route works, mark-as-read
  persists.

### Phase 2 — Push (2 weeks)

- Backend VAPID key generation + web-push delivery.
- Frontend permission UX (contextual + Settings page).
- Service worker push handler + click handler.
- Migrate PWA strategy from `generateSW` to `injectManifest`.
- Green light: push arrives on a closed tab within 5 s of the backend fire.

### Phase 3 — Preferences (1 week)

- Settings → Notifications page (category × channel matrix).
- Quiet hours + DND.
- Digest email (backend-side).
- Green light: user preferences are respected end-to-end.

### Phase 4 — Native desktop (1 week; requires Tauri Phase 3)

- Route `Notification` API through Tauri IPC when `isDesktop`.
- Sync unread badge to dock/taskbar via `set_badge_count`.
- Wire deep-link from notification click through `academorix://` router.
- Green light: closing the desktop app doesn't suppress notifications; opening
  one focuses the app on the right route.

Total ≈ 5 weeks.

---

## 12. Open questions

1. Do we want a **Slack / Microsoft Teams** integration channel? Non-trivial
   (OAuth + workspace mapping + rate limits) but frequently requested.
2. Do we buffer + coalesce like-kind notifications on the backend (one
   `attendance.missing` per session even if 8 athletes are late) or on the
   frontend?
3. Web Push has an ~30 KB payload cap after encryption. For long bodies we
   truncate to 200 chars and link out — is that acceptable for safeguarding
   alerts?
4. Do we support **rich notifications** (buttons on the OS notification itself)?
   Chrome and Firefox support two action buttons; Safari doesn't. Would need
   per-browser detection.
5. Should the `urgent` priority ring a sound? Requires an audio file + a user
   preference. Deferred to Phase 5 (post-GA).
6. What's the digest cadence for muted categories? Daily 08:00 local? Weekly
   Monday 09:00 local? User-configurable?
7. Do coaches on shared devices need per-user notification isolation (login →
   new user → different subs)? Yes — subscription lifecycle already handles it,
   but we need a Playwright test.
8. Is push mandatory for **billing alerts**? Users have complained about missing
   payment-failed alerts in the past; making push non-toggleable feels
   heavy-handed. Compromise: default to on but toggleable.

---

## 13. Related documents

- [`DESKTOP_PLAN.md`](./DESKTOP_PLAN.md) — how native notifications integrate on
  Tauri.
- [`ONBOARDING_PLAN.md`](./ONBOARDING_PLAN.md) — where the contextual permission
  request lives in the first-run flow.
- [`MENUS_PLAN.md`](./MENUS_PLAN.md) — DND toggle in the navbar profile popover,
  notification center bell.
- [`DASHBOARD_UX_PLAN.md`](./DASHBOARD_UX_PLAN.md) — parent UX spec with the
  settings-module scaffolding this doc extends.
