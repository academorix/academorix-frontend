/**
 * @file fcm-provider.tsx
 * @module providers/fcm-provider
 *
 * @description
 * React provider that owns the Firebase Cloud Messaging lifecycle for
 * the dashboard. It composes three concerns:
 *
 *   1. **State** — the current permission, the active FCM token,
 *      support/subscribing flags, and the last error surfaced by an
 *      enable/disable flow. Delegated to {@link useFcmRegistration}
 *      so both this provider and any future headless consumer share
 *      one battle-tested state machine.
 *   2. **Foreground delivery** — `onMessage` subscription that
 *      forwards every push payload to a HeroUI toast. Wired here (not
 *      in `main.tsx`) so the listener sits inside the React tree and
 *      can be torn down cleanly on unmount + hot reload.
 *   3. **Distribution** — a memoised {@link FcmContextValue} exposed
 *      via {@link useFcm}, matching the API described in the FCM
 *      design doc: `permission`, `token`, `isSupported`,
 *      `isSubscribing`, `subscribe`, `unsubscribe`, `error`.
 *
 * ## Mount contract
 *
 * The provider MUST be rendered inside `NotificationTransportProvider`
 * (for shared auth + toast surface access) and OUTSIDE
 * `CommandPaletteProvider` (so palette state changes don't tear FCM
 * down). See `src/App.tsx`.
 *
 * ## Graceful degradation
 *
 * On unsupported browsers / unconfigured Firebase / denied permission,
 * `subscribe()` and `unsubscribe()` resolve cleanly (with a friendly
 * toast where appropriate). The provider never throws — surfacing a
 * red toast for a "your browser doesn't support push" state is a
 * strictly worse UX than a disabled toggle.
 *
 * ## Foreground toast payload contract
 *
 * The backend can populate `payload.notification.title` + `.body`
 * (the FCM-canonical shape) or fall back to `payload.data.title` +
 * `.body` for silent pushes we still want to surface. If neither is
 * populated the toast title falls back to the app name so the user
 * never sees an empty toast.
 */

import { toast } from "@heroui/react";
import { createContext, useContext, useEffect, useMemo } from "react";

import type { ReactNode } from "react";

import { initFirebaseMessaging } from "@/lib/firebase";
import { useFcmRegistration } from "@/hooks/use-fcm-registration";

import type { FcmPermissionState } from "@/hooks/use-fcm-registration";

// -----------------------------------------------------------------------------
// Context shape
// -----------------------------------------------------------------------------

/**
 * Public contract exposed via {@link useFcm}. Matches the FCM design
 * doc — do NOT rename fields without updating every consumer.
 */
export type FcmContextValue = {
  /**
   * Reactive notification permission. `"unsupported"` when the
   * Notification API is absent (Safari private mode, some in-app
   * WebViews).
   */
  permission: FcmPermissionState;
  /**
   * The current FCM registration token — `null` when no subscription
   * exists (never fetched, revoked, or the browser doesn't support
   * push).
   */
  token: string | null;
  /**
   * Whether the current browser + Firebase build config combine to
   * make FCM usable at all. `false` immediately short-circuits any
   * UI that offers opt-in.
   */
  isSupported: boolean;
  /** True while a `subscribe()` / `unsubscribe()` flow is in flight. */
  isSubscribing: boolean;
  /** Last error thrown by a subscribe/unsubscribe attempt, or `null`. */
  error: Error | null;
  /**
   * Request permission (if needed), acquire a token from Firebase,
   * POST it to `/api/push/subscribe`, and persist the opt-in state
   * to localStorage.
   *
   * Resolves cleanly when the user denies permission — the caller
   * should read {@link FcmContextValue.permission} + {@link FcmContextValue.error}
   * to decide what to show next.
   */
  subscribe: () => Promise<void>;
  /**
   * Revoke the current token: DELETE `/api/push/subscribe/{token}`
   * (best-effort, backend has a reaper for orphans), delete the token
   * from Firebase, clear localStorage, and toast confirmation.
   */
  unsubscribe: () => Promise<void>;
};

const FcmContext = createContext<FcmContextValue | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

type FcmProviderProps = {
  children: ReactNode;
};

/**
 * Provider component — MUST wrap every subtree that calls
 * {@link useFcm}. Renders its children directly (headless); the toast
 * surface is provided by the HeroUI `<Toast.Provider>` mounted at the
 * app root.
 */
export function FcmProvider({ children }: FcmProviderProps): ReactNode {
  const registration = useFcmRegistration();

  // ---------------------------------------------------------------------------
  // Foreground `onMessage` → HeroUI toast
  // ---------------------------------------------------------------------------

  // WHY: `initFirebaseMessaging` is idempotent + supports being called
  // repeatedly with fresh listener callbacks (see its docblock). Wiring
  // the toast here — rather than in `main.tsx` — keeps the listener's
  // lifetime coupled to the React tree so hot-reload cleanly tears it
  // down. Even a strict-mode double mount is safe: the underlying
  // helper detaches the previous listener before attaching the new one.
  useEffect(() => {
    if (!registration.isSupported) return;

    void initFirebaseMessaging({
      onForegroundMessage: (payload) => {
        // WHY: the FCM `notification` block is the canonical spot for
        // title + body; some backend integrations (e.g. background-
        // only pushes we still want to surface in the UI when the tab
        // is focused) only populate `data`. Fall back so the toast is
        // never empty.
        const title = payload.notification?.title ?? payload.data?.title ?? "New notification";
        const body = payload.notification?.body ?? payload.data?.body ?? "";

        // WHY: bare `toast(title, {description})` mirrors the existing
        // pattern used by every other module in the app (see
        // `src/modules/dashboard/pages/dashboard.tsx`). Callers who want
        // to route to a specific colour can override via the payload's
        // `data.variant` field — kept out for now to keep the surface
        // predictable.
        toast(title, { description: body });
      },
    });
    // WHY: intentionally re-runs only when support flips — the effect
    // is idempotent so re-running is cheap, and gating on the boolean
    // avoids attaching an inert listener on unsupported clients.
  }, [registration.isSupported]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  // WHY: the hook's field names (`enable` / `disable` / `currentToken`
  // / `isSyncing`) are legacy — the design doc calls them
  // `subscribe` / `unsubscribe` / `token` / `isSubscribing`. Mapping
  // here (instead of renaming the hook) keeps churn contained.
  const value = useMemo<FcmContextValue>(
    () => ({
      permission: registration.permission,
      token: registration.currentToken,
      isSupported: registration.isSupported,
      isSubscribing: registration.isSyncing,
      error: registration.error,
      subscribe: registration.enable,
      unsubscribe: registration.disable,
    }),
    [
      registration.permission,
      registration.currentToken,
      registration.isSupported,
      registration.isSyncing,
      registration.error,
      registration.enable,
      registration.disable,
    ],
  );

  return <FcmContext.Provider value={value}>{children}</FcmContext.Provider>;
}

// -----------------------------------------------------------------------------
// Consumer hook
// -----------------------------------------------------------------------------

/**
 * Read the FCM context. Throws when called outside a `<FcmProvider>`
 * so misuse fails loud during development instead of silently reading
 * a stale default.
 */
export function useFcm(): FcmContextValue {
  const ctx = useContext(FcmContext);

  if (!ctx) {
    throw new Error("useFcm must be used inside <FcmProvider>.");
  }

  return ctx;
}
