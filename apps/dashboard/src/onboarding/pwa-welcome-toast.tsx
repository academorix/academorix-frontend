/**
 * @file pwa-welcome-toast.tsx
 * @module onboarding/pwa-welcome-toast
 *
 * @description
 * Renders zero DOM. Side-effect component that fires a one-shot
 * "Academorix installed" toast the first time a user launches the
 * dashboard from an installed PWA (`useSurface() === 'pwa'` or
 * `'pwa-shortcut'`).
 *
 * ## Contract (see ONBOARDING_PLAN.md §6)
 *
 *  - Fires: `toast.success('Academorix installed', { description: "It'll
 *    work offline too.", timeout: 8000 })`.
 *  - Persistence key: `academorix.onboarding.pwa.v1.firstLaunchedAt` (via
 *    the shared {@link readPwaState}/{@link writePwaState}). Once set,
 *    the toast never re-fires — even across sessions.
 *  - Gated by the `pwa.showWelcomeToast` config flag so ops can flip it
 *    off without a rebuild.
 *  - No-op on the web / desktop / deep-link surfaces.
 *
 * ## Mounting
 *
 * Rendered as a side-effect sibling of `<TourPopover>` inside
 * `<TourProvider>` so it lives under the app-wide `<ToastProvider />`
 * without adding another mount point in `providers.tsx`. Also exported
 * from the module barrel so a future refactor that mounts it next to
 * `<PwaUpdateToast>` can pull it in without a follow-up change.
 *
 * ## Analytics
 *
 * On first fire we emit `onboardingPwaWelcomeShown` through the shared
 * onboarding analytics helper. Instrumenting here (not at the toast
 * open) keeps the event flat with the surface value the user actually
 * landed on.
 */

import { toast } from "@academorix/ui/react";
import { useGetIdentity } from "@refinedev/core";
import { useEffect, useRef } from "react";

import type { Identity } from "@/types";
import type { ReactNode } from "react";

import { ONBOARDING_SCHEMA_VERSION, onboardingConfig } from "@/config/onboarding.config";
import { readPwaState, writePwaState } from "@/onboarding/storage";
import { emitOnboardingEvent } from "@/onboarding/tour/tour-analytics";
import { useTourTranslate } from "@/onboarding/tour/use-tour-translate";
import { useSurface } from "@/onboarding/use-surface";

/**
 * Renders no visible chrome — the effect below fires a HeroUI toast on
 * first PWA launch. Safe to mount unconditionally: guards against every
 * non-PWA surface and against a second fire per persisted state.
 *
 * @returns Always `null`.
 */
export function PwaWelcomeToast(): ReactNode {
  const surface = useSurface();
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id ?? null;
  const t = useTourTranslate();

  /**
   * Tracks whether we've already fired the toast this render session.
   * Prevents the effect from double-firing if a parent re-renders us
   * while the state write is in flight (localStorage writes are sync,
   * but the effect can still batch under React 18).
   */
  const firedThisSession = useRef(false);

  useEffect(() => {
    // Bail out on non-PWA surfaces. `useSurface()` cache is stable per
    // session, so this is a one-shot check.
    if (surface !== "pwa" && surface !== "pwa-shortcut") {
      return;
    }

    // Global kill switch — ops can flip off through the config.
    if (!onboardingConfig.pwa.showWelcomeToast) {
      return;
    }

    if (firedThisSession.current) {
      return;
    }

    const pwa = readPwaState(userId);

    // First-launched-at set means we've already welcomed this user on a
    // previous session. Don't double-toast.
    if (pwa.firstLaunchedAt !== null) {
      return;
    }

    firedThisSession.current = true;

    // Persist BEFORE firing the toast so a duplicate render can't beat
    // the write and re-toast. Timestamps are ISO for cross-service
    // legibility.
    const now = new Date().toISOString();

    writePwaState(userId, {
      ...pwa,
      firstLaunchedAt: now,
      version: ONBOARDING_SCHEMA_VERSION,
    });

    // Analytics happens here rather than inside the toast callback so
    // it fires whether or not the toast is actually rendered (e.g. no
    // ToastProvider mounted in a test harness).
    emitOnboardingEvent("onboardingPwaWelcomeShown", { surface });

    toast.success(t("onboarding.tour.pwaToast.title", "Academorix installed"), {
      // Plan §6 sets an 8-second display window. HeroUI's `timeout` is
      // milliseconds.
      timeout: 8000,
      description: t("onboarding.tour.pwaToast.body", "It'll work offline too."),
    });
  }, [surface, t, userId]);

  return null;
}
