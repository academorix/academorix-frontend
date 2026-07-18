# Implementation Plan

Living checklist for the FCM push-notification wire-up across the Academorix
stack. Two tracks land in parallel:

- **Frontend** (`refine-heroui-pro`) — Firebase JS SDK, service worker,
  permission UX, token registration.
- **Backend** (`backend/`) — `kreait/laravel-firebase`, push-subscription
  model + endpoints, Laravel Notification channel.

## Overview

Sits on top of the existing Communication module's notification stack. Firebase
Cloud Messaging becomes an **additional delivery channel** alongside whatever
the module already emits (in-app inbox, email, Reverb). Web + Android + iOS all
target the same `push_subscriptions` table; the platform-specific detail lives
in the token itself + a `platform` column so the delivery service knows which
payload shape to use.

Doppler already holds every credential:

- `academorix-dashboard` — `VITE_FIREBASE_*` (client config + VAPID)
- `academorix-backend` — `FIREBASE_PROJECT_ID`, `FIREBASE_SENDER_ID`, and
  `FIREBASE_CREDENTIALS` (service-account JSON, pending user).

## Tasks

### FE. Frontend (refine-heroui-pro)

- [ ] **FE1** Install `firebase` JS SDK and add a `src/lib/firebase/config.ts`
      module that reads `import.meta.env.VITE_FIREBASE_*` — never crashes at
      boot when env vars are missing (returns null and disables FCM instead).
- [ ] **FE2** `public/firebase-messaging-sw.js` — background service worker
      registered from main.tsx. Handles `onBackgroundMessage`, forwards to a
      browser notification via the Web Notifications API.
- [ ] **FE3** `src/lib/firebase/messaging.ts` — `initFirebaseMessaging()`
      initializes the SDK, wires foreground `onMessage` to toast, exposes
      `requestFcmToken(vapidKey)`, `revokeFcmToken()`, and `isFcmSupported()`.
- [ ] **FE4** `src/hooks/use-fcm-registration.ts` — hook that:
  - reports FCM support state,
  - reads the current permission,
  - exposes `enable()` / `disable()`,
  - POSTs to `/api/push/subscribe` on enable + `DELETE` on disable,
  - persists a `push.enabled` flag in `localStorage`,
  - refreshes the token on visibility/focus change.
- [ ] **FE5** Wire a "Web push" section into the notifications preferences page
      (`src/modules/notifications/pages/extra-0.tsx`): permission state pill,
      Enable/Disable button, current subscription info, help copy.
- [ ] **FE6** Foreground push handler dispatches through the existing HeroUI
      `toast` provider — inbox items still land server-side, the toast is only
      the "new mail, look up" affordance.
- [ ] **FE7** Register the service worker in main.tsx behind an
      `if (isFcmSupported())` guard so unsupported browsers (Safari without web
      push, private mode) fail silently.
- [ ] **FE8** `pnpm exec tsc -p tsconfig.app.json --noEmit` — zero net-new
      errors on touched files.
- [ ] **FE9** `pnpm build` — clean production build.

### BE. Backend (Laravel modules/Communication)

- [ ] **BE1** `composer require kreait/laravel-firebase`. Publish + trim
      `config/firebase.php`.
- [ ] **BE2** Migration `push_subscriptions`: `id`, `user_id` (fk), `tenant_id`
      (fk), `platform` enum (`web|android|ios`), `token` (unique), `endpoint`
      (nullable), `user_agent`, `last_seen_at`, `revoked_at`, timestamps.
- [ ] **BE3** `PushSubscription` model with `HasFactory`, casts, `belongsTo`
      user, scoped by tenant.
- [ ] **BE4** `PushSubscriptionRepositoryInterface` + Eloquent implementation.
      Idempotent `upsert(token, ...meta)` semantics — re-registration refreshes
      `last_seen_at`.
- [ ] **BE5** `Communication\Services\FcmPushService` — thin wrapper around
      `Kreait\Firebase\Contract\Messaging`. Sends a single message + batch
      messages. Silences `NotFound` / `InvalidArgument` responses by revoking
      the offending token.
- [ ] **BE6** `Communication\Notifications\Channels\FcmChannel` — Laravel
      Notification channel driver. Reads `toFcm()` on the notifiable's
      notifications, resolves subscriptions via the repository, hands off to
      `FcmPushService`.
- [ ] **BE7** Controller
      `Communication\Http\Controllers\PushSubscriptionController` —
      `store(POST /api/push/subscribe)` accepts `token`, `platform`,
      `user_agent`, `endpoint`; `destroy(DELETE /api/push/subscribe/{token})`.
      Sanctum-guarded, tenant-scoped.
- [ ] **BE8** `routes/api.php` inside the module — register the two routes under
      `auth:sanctum` + tenant middleware.
- [ ] **BE9** `HasPushSubscriptions` trait on `User` (or wired via existing
      Notifiable) so `$user->routeNotificationForFcm()` returns the current
      subscription set.
- [ ] **BE10** Feature test suite (Pest): register subscribes, re-register
      upserts, delete revokes, tenant scoping enforced.
- [ ] **BE11** README section on the Communication module explaining the FCM
      channel + how to author an `#[Notification]` with a `toFcm()` method.
- [ ] **BE12** `php artisan test --filter=Push` green.

### DO. Doppler (already done)

- [x] **DO1** Seed `VITE_FIREBASE_*` on `academorix-dashboard` (dev / stg /
      prd).
- [x] **DO2** Seed `FIREBASE_PROJECT_ID` + `FIREBASE_SENDER_ID` on
      `academorix-backend` (dev / stg / prd).
- [ ] **DO3** Once the service account JSON is generated: set
      `FIREBASE_CREDENTIALS` on `academorix-backend` (dev / stg / prd). User
      action, not agent-executable.

## Task Dependency Graph

```
DO1 + DO2 ─▶ FE1 ─▶ FE2 + FE3 ─▶ FE4 ─▶ FE5 ─▶ FE7 ─▶ FE8 ─▶ FE9
                              └─▶ FE6

BE1 ─▶ BE2 ─▶ BE3 ─▶ BE4 ─▶ BE5 ─▶ BE6 ─▶ BE10 ─▶ BE12
              │                   └─▶ BE7 ─▶ BE8 ─▶ BE9 ─▶ BE11
              └─▶ (independent of FE track)

DO3 ─▶ end-to-end smoke test (out of MCP scope)
```

## Legend

- `[x]` — merged / shipped
- `[ ]` — pending
- `[skip]` — out of scope
