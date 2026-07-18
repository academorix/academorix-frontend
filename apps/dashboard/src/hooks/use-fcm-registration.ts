/**
 * @file use-fcm-registration.ts
 * @module hooks/use-fcm-registration
 *
 * @description
 * React binding for the FCM subscription lifecycle. Owns the local
 * enable/disable state, keeps the backend in sync via
 * `POST /api/push/subscribe` and `DELETE /api/push/subscribe/{token}`,
 * and rotates tokens transparently on focus/visibility changes
 * (Firebase rotates registration tokens periodically — refreshing on
 * every foreground event is the documented pattern).
 *
 * ## Contract
 *
 * The hook is intentionally UI-agnostic: it exposes a small state
 * machine (`isSupported`, `permission`, `isEnabled`, `isSyncing`,
 * `currentToken`, `error`) plus two imperative actions (`enable`,
 * `disable`). The preferences page composes it into the browser-push
 * card; other surfaces (e.g. a first-login prompt) can reuse it as-is.
 *
 * ## Behaviour matrix
 *
 * | Boot state                          | Action taken                                   |
 * |-------------------------------------|-------------------------------------------------|
 * | `push.enabled` truthy + supported   | Silently re-register on mount (refresh path)   |
 * | Focus / visibility change + enabled | Refresh token, POST if it rotated              |
 * | `enable()`                          | Request permission → register → POST subscribe |
 * | `disable()`                         | DELETE subscribe → deleteToken → clear storage |
 *
 * @see src/lib/firebase/messaging.ts — the runtime SDK wrapper this hook drives
 */

import { toast } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCurrentPermission,
  initFirebaseMessaging,
  requestFcmToken,
  revokeFcmToken,
} from "@/lib/firebase/messaging";
import { isFirebaseConfigured } from "@/lib/firebase/config";

// -----------------------------------------------------------------------------
// Constants + typed env
// -----------------------------------------------------------------------------

/** LocalStorage flag — persists the user's opt-in across page loads. */
const STORAGE_KEY_ENABLED = "academorix.push.enabled";
/** LocalStorage slot — remembers the last token so we can spot rotations. */
const STORAGE_KEY_TOKEN = "academorix.push.token";

type ApiEnv = { VITE_API_URL?: string };

const API_URL = (import.meta.env as unknown as ApiEnv).VITE_API_URL ?? "";

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export type FcmPermissionState = NotificationPermission | "unsupported";

export type UseFcmRegistration = {
  /** Whether the browser + build config combine to make FCM available at all. */
  isSupported: boolean;
  /** Cached notification permission — kept in state so re-renders track the OS. */
  permission: FcmPermissionState;
  /** Persisted opt-in state — true when a token is stored and the user opted in. */
  isEnabled: boolean;
  /** True while an enable/disable flow is in flight. */
  isSyncing: boolean;
  /** Current FCM token, if any. */
  currentToken: string | null;
  /** Trigger the enable flow (permission → token → backend POST). */
  enable: () => Promise<void>;
  /** Trigger the disable flow (backend DELETE → local revoke). */
  disable: () => Promise<void>;
  /** Last thrown error, or null. */
  error: Error | null;
};

// -----------------------------------------------------------------------------
// Local storage helpers
// -----------------------------------------------------------------------------

/** WHY: private-mode / SSR-guarded read that never throws. */
function readFlag(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;

    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string, value: string | null): void {
  try {
    if (typeof window === "undefined") return;
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private-mode failures — the hook still functions,
    // it just won't remember state across reloads.
  }
}

// -----------------------------------------------------------------------------
// Backend sync
// -----------------------------------------------------------------------------

/**
 * POST the token to the Sanctum-guarded backend. Returns true on 2xx,
 * false on any failure. Callers use the boolean to decide whether the
 * local state should optimistically flip.
 *
 * WHY: swallowing all errors here (rather than throwing) keeps the
 * hook resilient to offline flapping — the token still lives in
 * localStorage and will re-sync on the next focus event.
 */
async function postSubscribe(token: string): Promise<boolean> {
  if (!API_URL) return false;

  try {
    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        token,
        platform: "web",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
    });

    return response.ok;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[fcm] POST /api/push/subscribe failed", error);

    return false;
  }
}

async function deleteSubscribe(token: string): Promise<boolean> {
  if (!API_URL) return false;

  try {
    const response = await fetch(`${API_URL}/api/push/subscribe/${encodeURIComponent(token)}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    return response.ok;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[fcm] DELETE /api/push/subscribe failed", error);

    return false;
  }
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * React state layer for browser push. See {@link UseFcmRegistration}
 * for the returned shape.
 */
export function useFcmRegistration(): UseFcmRegistration {
  const supportedRef = useRef<boolean>(isFirebaseConfigured());
  const [permission, setPermission] = useState<FcmPermissionState>(() => getCurrentPermission());
  const [currentToken, setCurrentToken] = useState<string | null>(() =>
    readFlag(STORAGE_KEY_TOKEN),
  );
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // WHY: enabled state requires BOTH the persisted flag AND a stored
    // token — a stale flag without a token would otherwise show the UI
    // as enabled while nothing was actually registered.
    return readFlag(STORAGE_KEY_ENABLED) === "1" && readFlag(STORAGE_KEY_TOKEN) !== null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSupported = supportedRef.current && permission !== "unsupported";

  // ---------------------------------------------------------------------------
  // Bootstrap: silent re-register on refresh
  // ---------------------------------------------------------------------------

  // WHY: FCM tokens can rotate. If the user opted in previously we
  // silently refresh on mount so the backend always has the current
  // token; without this an old token could keep the row alive but
  // stop delivering pushes.
  useEffect(() => {
    if (!isSupported) return;

    const alreadyOptedIn = readFlag(STORAGE_KEY_ENABLED) === "1";

    if (!alreadyOptedIn) {
      // Still boot the SDK so foreground toasts land — just skip the
      // token dance.
      void initFirebaseMessaging();

      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await requestFcmToken();

      if (cancelled) return;

      if (!result) {
        // Permission may have been revoked in the browser settings —
        // clear the stale flag so the UI accurately reflects reality.
        setPermission(getCurrentPermission());

        return;
      }

      const previous = readFlag(STORAGE_KEY_TOKEN);

      if (previous !== result.token) {
        // Token rotated behind our back — sync to the backend.
        await postSubscribe(result.token);
      }

      writeFlag(STORAGE_KEY_TOKEN, result.token);
      setCurrentToken(result.token);
      setIsEnabled(true);
      setPermission(getCurrentPermission());
    })();

    return () => {
      cancelled = true;
    };
    // WHY: intentionally run once — refresh on every render would be a
    // network amplifier during a strict-mode double mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  // ---------------------------------------------------------------------------
  // Refresh on focus / visibility change
  // ---------------------------------------------------------------------------

  // WHY: Firebase's own docs recommend refreshing the token whenever
  // the tab regains focus. Real-world token rotation happens on ~
  // month-long timescales but service-worker updates + hardware wipes
  // can also rotate it — polling on visibility keeps us honest.
  useEffect(() => {
    if (!isSupported) return;
    if (!isEnabled) return;

    const refresh = async () => {
      const result = await requestFcmToken();

      if (!result) return;
      const previous = readFlag(STORAGE_KEY_TOKEN);

      if (previous === result.token) return;

      await postSubscribe(result.token);
      writeFlag(STORAGE_KEY_TOKEN, result.token);
      setCurrentToken(result.token);
    };

    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isSupported, isEnabled]);

  // ---------------------------------------------------------------------------
  // Enable
  // ---------------------------------------------------------------------------

  const enable = useCallback(async () => {
    if (!isSupported) return;
    if (isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      const result = await requestFcmToken();
      const nextPermission = getCurrentPermission();

      setPermission(nextPermission);

      if (!result) {
        // The most common failure is a `denied` permission — the SDK
        // returns null without throwing, so we synthesise a nice
        // error for the UI to surface. Some environments will surface
        // a genuine SDK error via `console.warn`.
        if (nextPermission === "denied") {
          const err = new Error("Notification permission was denied.");

          setError(err);
          toast.danger("Browser push blocked", {
            description: "Notification permission was denied. Enable it in your browser settings.",
          });
        } else {
          const err = new Error("Could not register for browser push.");

          setError(err);
          toast.danger("Couldn't enable browser push", {
            description: "Something went wrong while registering this device.",
          });
        }

        return;
      }

      const ok = await postSubscribe(result.token);

      if (!ok) {
        // Backend failed — revoke locally so we don't advertise a
        // "connected" state that isn't real.
        await revokeFcmToken();
        const err = new Error("Backend refused the push subscription.");

        setError(err);
        toast.danger("Couldn't save your device", {
          description: "Try again in a moment — the push service didn't respond.",
        });

        return;
      }

      writeFlag(STORAGE_KEY_ENABLED, "1");
      writeFlag(STORAGE_KEY_TOKEN, result.token);
      setCurrentToken(result.token);
      setIsEnabled(true);
      toast.success("Browser push enabled", {
        description:
          "You'll get notifications on this device even when Academorix is in the background.",
      });
    } catch (caught) {
      // WHY: no code path above throws today, but keeping the catch
      // means a future addition can't silently break the button state.
      const err = caught instanceof Error ? caught : new Error(String(caught));

      setError(err);
      toast.danger("Couldn't enable browser push", { description: err.message });
    } finally {
      setIsSyncing(false);
    }
  }, [isSupported, isSyncing]);

  // ---------------------------------------------------------------------------
  // Disable
  // ---------------------------------------------------------------------------

  const disable = useCallback(async () => {
    if (!isSupported) return;
    if (isSyncing) return;

    setIsSyncing(true);
    setError(null);

    const token = readFlag(STORAGE_KEY_TOKEN);

    try {
      // Best-effort backend call. If it fails we still revoke locally —
      // the backend has a cron that reaps stale tokens, and the user's
      // intent is unambiguous.
      if (token) await deleteSubscribe(token);
      await revokeFcmToken();
      writeFlag(STORAGE_KEY_ENABLED, null);
      writeFlag(STORAGE_KEY_TOKEN, null);
      setCurrentToken(null);
      setIsEnabled(false);
      toast.success("Browser push disabled", {
        description: "You won't get notifications on this device.",
      });
    } catch (caught) {
      const err = caught instanceof Error ? caught : new Error(String(caught));

      setError(err);
      toast.danger("Couldn't fully disable browser push", {
        description: "The device may still receive one or two more notifications.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSupported, isSyncing]);

  return {
    isSupported,
    permission,
    isEnabled,
    isSyncing,
    currentToken,
    enable,
    disable,
    error,
  };
}
