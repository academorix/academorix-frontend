/**
 * @file tour-provider.tsx
 * @module onboarding/tour/tour-provider
 *
 * @description
 * Owns the runtime state of the first-run tour. Mounts high in the
 * tree (inside `<Providers>`, below Refine so router hooks are
 * available) and exposes an imperative + reactive API via
 * {@link useTour}. Renders nothing until triggered.
 *
 * ## Trigger conditions
 *
 * Fires the tour when ANY of the following holds AND the global
 * feature flag {@link "@/config/features.config".features.onboardingTour}
 * is on:
 *
 * 1. `?firstRun=1` on the URL — always. Post-signup redirect uses
 *    this so a fresh workspace always tours the shell.
 * 2. `useSurface() === 'pwa'` OR `'pwa-shortcut'` AND
 *    `academorix.onboarding.pwa.v1.tourCompletedAt` unset — first
 *    installed-app launch.
 * 3. `useSurface() === 'desktop'` AND desktop state unset — first
 *    Tauri launch (tour with desktop preface step 0).
 * 4. `restartTour()` was called manually (from Help → Restart tour).
 *
 * ## URL cleanup
 *
 * `firstRun=1` and `source=pwa`/`source=pwa-shortcut` are one-shot
 * signals; the provider strips them from the URL on first read so a
 * reload does not re-fire the tour. The `useSurface()` cache stays
 * intact because it was resolved BEFORE the cleanup ran — see the
 * `use-surface.ts` docblock for the caching contract.
 *
 * ## Persistence
 *
 * Every state change (`advance`, `back`, `skip`, `complete`,
 * `restart`) writes through {@link "@/lib/onboarding/storage"} so the
 * tour survives reloads and cross-tab switches. The provider reads
 * once on mount, mutates in memory, and writes on every commit.
 *
 * @see onboarding module — Flow 2: First-run tour.
 */

import { useGetIdentity } from "@refinedev/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "@stackra/routing/react";

import type {
  OnboardingSurface,
  OnboardingTourStep,
  TourActions,
  TourRuntimeState,
  TourStorageState,
} from "@/lib/onboarding/onboarding.types";
import type { Identity } from "@/types";
import type { ReactNode } from "react";

import { EVENTS } from "@/config/analytics.config";
import { features } from "@/config/features.config";
import { ONBOARDING_SCHEMA_VERSION, TOUR_STEPS } from "@/config/onboarding.config";
import { useCloudOnboardingSync } from "@/lib/onboarding/cloud-state";
import { DEFAULT_TOUR_STATE } from "@/lib/onboarding/onboarding.types";
import { PwaWelcomeToast } from "@/lib/onboarding/pwa-welcome-toast";
import { readPwaState, readTourState, writeTourState } from "@/lib/onboarding/storage";
import { emitOnboardingEvent } from "@/lib/onboarding/tour/tour-analytics";
import { TourPopover } from "@/lib/onboarding/tour/tour-popover";
import { useSurface } from "@/lib/onboarding/use-surface";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** Value exposed by the tour context to consumers of `useTour()`. */
interface TourContextValue extends TourRuntimeState, TourActions {
  /** The active step list (surface-aware — includes preface for PWA/desktop). */
  steps: readonly OnboardingTourStep[];
  /** The active surface — consumers use this to render surface-specific chrome. */
  surface: OnboardingSurface;
}

const TourContext = createContext<TourContextValue | null>(null);

/**
 * Reads the current tour context. Throws with a helpful message when
 * used outside `<TourProvider>` so a misplaced import is caught in
 * dev the moment it runs.
 */
export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);

  if (ctx === null) {
    throw new Error("useTour must be used within a <TourProvider>.");
  }

  return ctx;
}

// ---------------------------------------------------------------------------
// Imperative restart entry (for the Help menu)
// ---------------------------------------------------------------------------

/**
 * Module-scoped reference to the mounted provider's `restart`
 * function. The Help → Restart tour menu command imports
 * {@link restartTour} from the barrel; this is how we let a
 * non-React caller kick the tour without threading refs through
 * the menu registry.
 *
 * Set inside the provider's mount effect; cleared on unmount so a
 * stale reference can't be called after route-driven remount.
 *
 * TODO(sub-agent-integration): the menu registry at
 * `@/lib/menus/command.types` documents `help.restart_tour` as the menu
 * id. When the Menus sub-agent wires that command up, it will
 * import {@link restartTour} from `@/lib/onboarding` and call it here.
 */
let mountedRestart: (() => void) | null = null;

/**
 * Imperative "restart the tour" entry called by non-React callers
 * (the Help menu command, the developer command palette). No-op when
 * the provider is not mounted (returns silently rather than throwing
 * so a rogue call in an unauthenticated view can't crash).
 */
export function restartTour(): void {
  mountedRestart?.();
}

// ---------------------------------------------------------------------------
// Trigger logic
// ---------------------------------------------------------------------------

/**
 * Decides whether the tour should auto-fire on this render. Pure
 * function of the inputs so its behavior is trivially testable.
 *
 * @param surface - What surface the user is on.
 * @param firstRun - `?firstRun=1` on the URL.
 * @param tourState - Current persisted tour state.
 * @param pwaTourCompleted - Whether PWA-specific tour is done.
 * @returns `true` iff we should show the tour immediately.
 */
function shouldAutoTrigger(
  surface: OnboardingSurface,
  firstRun: boolean,
  tourState: TourStorageState,
  pwaTourCompleted: boolean,
): boolean {
  // Global kill-switch — ops can suppress the tour entirely.
  if (!features.onboardingTour) {
    return false;
  }

  // `firstRun=1` always wins. This is the post-signup redirect
  // signal; we want the tour EVERY time even if the user completed
  // it under a previous schema version.
  if (firstRun) {
    return true;
  }

  // Already completed or dismissed → no auto-fire. The user can
  // still invoke via `restartTour()`.
  if (tourState.completedAt !== null || tourState.dismissedAt !== null) {
    return false;
  }

  // Desktop / PWA first launch → auto-fire.
  if (surface === "desktop") {
    return true;
  }

  if ((surface === "pwa" || surface === "pwa-shortcut") && !pwaTourCompleted) {
    return true;
  }

  // Otherwise — no auto-fire. Users who want the tour can find it
  // under Help → Restart tour.
  return false;
}

/**
 * Builds the step list for the active surface. PWA/desktop launches
 * get a preface step 0 the plain web tour skips.
 *
 * The seed steps come from
 * {@link "@/config/onboarding.config".TOUR_STEPS} which owns the four
 * canonical anchors (workspace, palette, notifications, settings).
 * The preface is synthesised here — it has no anchor selector
 * because it renders centered on the screen.
 */
function buildStepList(surface: OnboardingSurface): readonly OnboardingTourStep[] {
  const canonical = [...TOUR_STEPS].sort((a, b) => a.order - b.order);

  if (surface === "desktop") {
    return [
      {
        id: "tour.desktop.preface",
        order: 0,
        titleKey: "onboarding.tour.desktop.title",
        bodyKey: "onboarding.tour.desktop.body",
        // Anchored to the tray icon; render centered when it doesn't exist yet.
        anchorSelector: '[data-testid="app-tray-icon"]',
        surfaces: ["desktop"],
      },
      ...canonical,
    ];
  }

  if (surface === "pwa" || surface === "pwa-shortcut") {
    return [
      {
        id: "tour.pwa.preface",
        order: 0,
        titleKey: "onboarding.tour.pwa.title",
        bodyKey: "onboarding.tour.pwa.body",
        // No anchor — centered dialog.
        surfaces: ["pwa", "pwa-shortcut"],
      },
      ...canonical,
    ];
  }

  return canonical;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/** Props for {@link TourProvider}. */
interface TourProviderProps {
  children: ReactNode;
}

/**
 * Mounts the tour context + overlay. Renders `null` for its DOM
 * output until the tour is active; children always render.
 */
export function TourProvider({ children }: TourProviderProps): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const surface = useSurface();
  const { data: identity } = useGetIdentity<Identity>();
  const userId = identity?.id ?? null;

  // Load persisted state once per identity — a workspace switch reads
  // the new user's state instead of leaking the old one's.
  const [tourState, setTourState] = useState<TourStorageState>(DEFAULT_TOUR_STATE);
  const [isActive, setIsActive] = useState(false);

  // Track whether we've already run the initial trigger check for
  // this identity. A React strict-mode double-render must not fire
  // the tour twice.
  const hasEvaluatedTrigger = useRef(false);

  useEffect(() => {
    setTourState(readTourState(userId));
    hasEvaluatedTrigger.current = false;
  }, [userId]);

  // Build the step list once per surface — swapping surfaces mid-
  // session isn't a real case, but memoising keeps identity stable.
  const steps = useMemo(() => buildStepList(surface), [surface]);

  const persist = useCallback(
    (next: TourStorageState) => {
      setTourState(next);
      writeTourState(userId, next);
    },
    [userId],
  );

  // ------- Actions ---------------------------------------------------------

  const next = useCallback(() => {
    setTourState((current) => {
      const step = current.step + 1;

      if (step >= steps.length) {
        // Reached the last step — mark complete + close.
        const done: TourStorageState = {
          ...current,
          completedAt: new Date().toISOString(),
          step: steps.length - 1,
          version: ONBOARDING_SCHEMA_VERSION,
        };

        writeTourState(userId, done);
        setIsActive(false);
        emitOnboardingEvent("onboardingTourCompleted", {
          surface,
          restarted: current.restartedCount,
        });

        return done;
      }

      const advanced: TourStorageState = {
        ...current,
        step,
        version: ONBOARDING_SCHEMA_VERSION,
      };

      writeTourState(userId, advanced);
      emitOnboardingEvent("onboardingTourStepAdvanced", {
        surface,
        from_step: current.step,
        to_step: step,
      });

      return advanced;
    });
  }, [steps.length, surface, userId]);

  const back = useCallback(() => {
    setTourState((current) => {
      const step = Math.max(0, current.step - 1);

      if (step === current.step) {
        return current;
      }

      const rewound: TourStorageState = {
        ...current,
        step,
        version: ONBOARDING_SCHEMA_VERSION,
      };

      writeTourState(userId, rewound);
      emitOnboardingEvent("onboardingTourStepBacked", {
        surface,
        from_step: current.step,
        to_step: step,
      });

      return rewound;
    });
  }, [surface, userId]);

  const skip = useCallback(() => {
    setTourState((current) => {
      const dismissed: TourStorageState = {
        ...current,
        dismissedAt: new Date().toISOString(),
        version: ONBOARDING_SCHEMA_VERSION,
      };

      writeTourState(userId, dismissed);
      emitOnboardingEvent("onboardingTourSkipped", {
        surface,
        at_step: current.step,
      });

      return dismissed;
    });
    setIsActive(false);
  }, [surface, userId]);

  const close = useCallback(() => {
    setIsActive(false);
  }, []);

  const restart = useCallback(() => {
    setTourState((current) => {
      const reset: TourStorageState = {
        completedAt: null,
        dismissedAt: null,
        step: 0,
        restartedCount: current.restartedCount + 1,
        version: ONBOARDING_SCHEMA_VERSION,
      };

      writeTourState(userId, reset);
      emitOnboardingEvent("onboardingTourRestarted", {
        surface,
        trigger: "menu",
      });

      return reset;
    });
    setIsActive(true);
  }, [surface, userId]);

  // Expose `restart` as a module-scoped imperative entry for the
  // Help menu. Refresh the reference on every mount so remounts
  // don't leave a stale closure hanging.
  useEffect(() => {
    mountedRestart = restart;

    return () => {
      if (mountedRestart === restart) {
        mountedRestart = null;
      }
    };
  }, [restart]);

  // ------- Auto-trigger ---------------------------------------------------

  useEffect(() => {
    if (hasEvaluatedTrigger.current) {
      return;
    }

    hasEvaluatedTrigger.current = true;

    const firstRun = searchParams.get("firstRun") === "1";
    const pwaState = readPwaState(userId);
    const pwaTourCompleted = pwaState.tourCompletedAt !== null;

    if (shouldAutoTrigger(surface, firstRun, readTourState(userId), pwaTourCompleted)) {
      // Reset the step index so a partial past run doesn't leave the
      // user in the middle of the flow on a fresh trigger.
      persist({
        ...readTourState(userId),
        step: 0,
        version: ONBOARDING_SCHEMA_VERSION,
      });
      setIsActive(true);
      emitOnboardingEvent("onboardingTourStarted", {
        surface,
        step_count: steps.length,
      });
    }

    // Strip the one-shot URL markers so a reload doesn't re-fire.
    // `source=pwa` is read by `useSurface()` on first render and
    // cached; stripping it here does not affect the resolved surface.
    if (firstRun || searchParams.has("source") || searchParams.has("deep")) {
      const nextParams = new URLSearchParams(searchParams);

      nextParams.delete("firstRun");
      nextParams.delete("source");
      nextParams.delete("deep");
      setSearchParams(nextParams, { replace: true });
    }
  }, [persist, searchParams, setSearchParams, steps.length, surface, userId]);

  // ------- Context value --------------------------------------------------

  const value = useMemo<TourContextValue>(
    () => ({
      isActive,
      currentStep: tourState.step,
      totalSteps: steps.length,
      isCompleted: tourState.completedAt !== null,
      isDismissed: tourState.dismissedAt !== null,
      restartedCount: tourState.restartedCount,
      restart,
      next,
      back,
      skip,
      close,
      steps,
      surface,
    }),
    [back, close, isActive, next, restart, skip, steps, surface, tourState],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {/* Render the popover shell so it lives once, positioned by the
          active step's anchor selector. Renders null when inactive. */}
      <TourPopover />
      {/* Side-effect siblings — render nothing but each hooks up a
          one-shot behaviour when its precondition fires:
          - `<PwaWelcomeToast />` fires the "Academorix installed"
            toast on the first PWA launch (plan §6).
          - `<CloudStateSync />` opportunistically syncs onboarding
            state to the backend so a device swap picks up progress. */}
      <PwaWelcomeToast />
      <CloudStateSync />
    </TourContext.Provider>
  );
}

/**
 * Renderless side-effect wrapper around `useCloudOnboardingSync` so the
 * hook can be mounted inside the TourProvider without adding a hook
 * call to `TourProvider` itself (keeps the provider's dependency graph
 * unchanged, which matters for the mount-order guarantees the tests
 * assert on).
 */
function CloudStateSync(): ReactNode {
  useCloudOnboardingSync();

  return null;
}

/**
 * Test-only: reads the internal trigger predicate. Kept in a
 * `__testables` object so the export surface stays clean.
 *
 * @internal
 */
export const __testables = {
  shouldAutoTrigger,
  buildStepList,
};

/** Analytics event ids emitted by the tour. Exported for test assertions. */
export const TOUR_ANALYTICS_EVENTS = {
  started: EVENTS.onboardingTourStarted,
  advanced: EVENTS.onboardingTourStepAdvanced,
  backed: EVENTS.onboardingTourStepBacked,
  skipped: EVENTS.onboardingTourSkipped,
  completed: EVENTS.onboardingTourCompleted,
  restarted: EVENTS.onboardingTourRestarted,
} as const;
