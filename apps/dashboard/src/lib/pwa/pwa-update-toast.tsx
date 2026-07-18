/**
 * @file pwa-update-toast.tsx
 * @module pwa/pwa-update-toast
 *
 * @description
 * Renders zero DOM but drives two side-effects wired to the service worker
 * lifecycle exposed by {@link usePwaRegistration}:
 *
 *   1. When `needRefresh` flips to `true` (a new SW is waiting), open a
 *      HeroUI toast titled "Update available" with a **Refresh** action
 *      button. Clicking it calls `updateServiceWorker(true)` — which triggers
 *      `skipWaiting()` and reloads the page against the new SW.
 *
 *   2. When `offlineReady` flips to `true` (first SW install completed), open
 *      a passive success toast titled "Ready to work offline" that auto-
 *      dismisses. No action button — informational only.
 *
 * The component:
 *   - Returns `null`. All UX is delivered through the toast queue.
 *   - Renders once. Do NOT mount twice or you'll register the SW twice and
 *     see duplicate toasts. Enforced by only rendering inside `<Providers>`.
 *   - Is production-only. In dev the parent skips mounting it — see the
 *     `PwaUpdateToast` docblock in `src/providers.tsx`.
 *
 * ## Why toast?
 *
 * The dashboard is a work tool. Users routinely have unsaved drafts open
 * (form fields, filter selections). A full-screen modal blocks their work; a
 * silent auto-reload eats their state. A toast strikes the balance — visible,
 * dismissible, respects unsaved work.
 */

import { toast } from "@stackra/ui/react";
import { useEffect, useRef } from "react";

import type { ReactNode } from "react";

import { usePwaRegistration } from "@/lib/pwa/register-sw";

/**
 * Copy for the "update available" prompt. Kept as constants so a future i18n
 * pass can lift them into `messages/{locale}.json` with a single diff.
 */
const UPDATE_TITLE = "Update available";
const UPDATE_DESCRIPTION =
  "A newer version of Academorix has been installed. Refresh to load it now.";
const UPDATE_ACTION_LABEL = "Refresh";

/**
 * Copy for the passive "offline ready" confirmation.
 */
const OFFLINE_TITLE = "Ready to work offline";
const OFFLINE_DESCRIPTION = "Academorix is now installed on this device and available offline.";

/**
 * Renders no visible chrome — the two effects below open HeroUI toasts when
 * the service-worker lifecycle flips the reactive flags.
 */
export function PwaUpdateToast(): ReactNode {
  const { needRefresh, offlineReady, dismissUpdate, dismissOfflineReady, updateServiceWorker } =
    usePwaRegistration();

  /**
   * Track the HeroUI toast key so we can dismiss the previous "update
   * available" toast if `needRefresh` flips false (e.g. user accepted the
   * update or a newer waiting SW replaced the previous one).
   */
  const updateToastKey = useRef<string | null>(null);

  /**
   * Track whether we already surfaced the one-shot offline-ready toast, so
   * a re-render can't emit it twice.
   */
  const offlineToastShown = useRef(false);

  /*
   * ---------------------------------------------------------------------------
   * Effect 1 — Update prompt
   * ---------------------------------------------------------------------------
   * Opens a toast with a "Refresh" action when `needRefresh` becomes true.
   * Closes the toast if `needRefresh` returns to false without user action.
   */
  useEffect(() => {
    if (!needRefresh) {
      // If we had a pending toast (rare — e.g. plugin cleared the flag
      // programmatically), dismiss it too.
      if (updateToastKey.current) {
        toast.close(updateToastKey.current);
        updateToastKey.current = null;
      }

      return;
    }

    /**
     * Accept the update — activate the waiting SW and reload the page.
     *
     * `updateServiceWorker(true)` is documented to reject only on truly
     * exceptional failures (permission revoked, registration gone). We
     * fall back to a hard reload so users are never stuck on a stale
     * shell.
     */
    const acceptUpdate = (): void => {
      // Close our own toast so it doesn't linger during the reload flip.
      if (updateToastKey.current) {
        toast.close(updateToastKey.current);
        updateToastKey.current = null;
      }

      void updateServiceWorker(true).catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.warn("[pwa] updateServiceWorker rejected; forcing hard reload", error);
        window.location.reload();
      });
    };

    /**
     * We DO NOT auto-dismiss the update toast. Reason: if the user is deep
     * in a form we want them to make a conscious "Refresh" choice rather
     * than lose the prompt to a 5-second timeout. `timeout: 0` is HeroUI's
     * "persist forever" sentinel.
     */
    const key = toast(UPDATE_TITLE, {
      description: UPDATE_DESCRIPTION,
      variant: "accent",
      timeout: 0,
      actionProps: {
        children: UPDATE_ACTION_LABEL,
        onPress: acceptUpdate,
      },
      onClose: () => {
        // User dismissed manually — clear the flag so we don't re-open the
        // toast on the next render pass. The next detection cycle (~1h)
        // will flip `needRefresh` back to true and we'll re-prompt.
        dismissUpdate();
        updateToastKey.current = null;
      },
    });

    updateToastKey.current = key;

    return () => {
      // If React unmounts us (route change during dev, StrictMode remount),
      // clean up the toast so it can't outlive the hook.
      if (updateToastKey.current) {
        toast.close(updateToastKey.current);
        updateToastKey.current = null;
      }
    };
  }, [needRefresh, dismissUpdate, updateServiceWorker]);

  /*
   * ---------------------------------------------------------------------------
   * Effect 2 — Offline-ready confirmation
   * ---------------------------------------------------------------------------
   * Passive one-shot toast: appears once on first SW install, then never
   * again for the lifetime of the tab.
   */
  useEffect(() => {
    if (!offlineReady || offlineToastShown.current) {
      return;
    }

    offlineToastShown.current = true;

    // Auto-dismisses after HeroUI's default timeout — this one is genuinely
    // informational, no user action required.
    toast.success(OFFLINE_TITLE, {
      description: OFFLINE_DESCRIPTION,
    });

    // Reset the reactive flag so the hook can flip it again if a fresh
    // install ever runs (e.g. after the user manually clears site data).
    dismissOfflineReady();
  }, [offlineReady, dismissOfflineReady]);

  return null;
}
