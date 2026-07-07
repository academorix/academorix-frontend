/**
 * @file use-install-detection.ts
 * @module modules/dashboard/widgets/onboarding-checklist/use-install-detection
 *
 * @description
 * Detects whether the running SPA is a first-class installed app (either PWA
 * on the browser side, or the Tauri desktop shell). Drives task 11 of the
 * onboarding checklist ("Install the app") which auto-ticks the moment the
 * user launches the installed variant.
 *
 * Three signals are combined:
 *
 *  1. `matchMedia("(display-mode: standalone)").matches` — the universal
 *     "chromeless installed PWA" signal. Chrome/Edge/Safari/Firefox all set
 *     this when the manifest-driven install completes and the user launches
 *     from the home screen or launcher.
 *  2. `navigator.standalone === true` — the iOS Safari-specific
 *     display-mode signal. Older iOS variants set this instead of the
 *     media-query above.
 *  3. `useSurface() === 'desktop'` — running inside the Tauri shell counts
 *     as installed for the purposes of the checklist. The user did the
 *     equivalent of a native install and doesn't need to be nagged.
 *
 * Also captures the browser's `beforeinstallprompt` event so the checklist
 * can offer a "Do it now" button that opens the native install prompt —
 * without keeping the app in a permanent "installable" mode. The captured
 * event is exposed as `prompt()` so the widget can trigger it on click, and
 * as `canPrompt` so the widget can decide between "Do it now" (calls
 * `prompt()`) and a generic doc link (when the event never fired).
 */

import { useCallback, useEffect, useState } from "react";

import { useSurface } from "@/onboarding/use-surface";

/**
 * Non-standard `BeforeInstallPromptEvent` shape. The DOM lib doesn't ship
 * types for it (Chromium-only) so we describe just the methods we call.
 * Keeps the module type-safe without pulling in a global augmentation.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Return shape of {@link useInstallDetection}. */
export interface InstallDetection {
  /** True when the app is running as an installed PWA or the Tauri shell. */
  isInstalled: boolean;
  /**
   * True when the browser has offered `beforeinstallprompt` and we captured
   * it — the caller can fire {@link prompt} to open the native install UX.
   */
  canPrompt: boolean;
  /**
   * Fires the captured `beforeinstallprompt` event. Resolves with the user's
   * choice (`"accepted" | "dismissed" | "unavailable"`). Called from the
   * checklist's "Do it now" button on task 11.
   */
  prompt: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

/**
 * Reads the current install status + captures the install-prompt event.
 * Returns a stable object shape across renders so `useMemo` consumers of the
 * task list don't churn.
 */
export function useInstallDetection(): InstallDetection {
  const surface = useSurface();

  // The Tauri shell is always "installed" — you can't run it any other way.
  // Prefer this signal because it doesn't depend on the media query firing
  // (WKWebView / WebView2 do implement matchMedia but the standalone value
  // isn't guaranteed inside the Tauri webview).
  const isDesktopSurface = surface === "desktop";

  const [displayModeStandalone, setDisplayModeStandalone] = useState(() => checkDisplayMode());
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Subscribe to display-mode transitions — a user can install the app
  // during a session and the checklist should tick without a reload.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const listener = (event: MediaQueryListEvent): void => {
      setDisplayModeStandalone(event.matches);
    };

    // `addEventListener` on MediaQueryList is the modern API; the older
    // `addListener` shape still exists on Safari <14. Feature-detect
    // instead of typecasting to keep the code readable.
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);

      return () => mediaQuery.removeEventListener("change", listener);
    }

    return undefined;
  }, []);

  // Capture the `beforeinstallprompt` event so the widget can trigger it
  // later. We ALSO listen for `appinstalled` to clear the captured event
  // (the user just installed — no more prompt possible on this tab).
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event): void => {
      // Chromium fires this event before the browser shows the install
      // banner. Preventing default lets us defer + trigger it manually
      // when the user clicks "Do it now" on task 11.
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = (): void => {
      setInstallPrompt(null);
      setDisplayModeStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const prompt = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!installPrompt) {
      return "unavailable";
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      // Chrome fires `beforeinstallprompt` only once — clear the captured
      // event so a subsequent click doesn't call a stale reference.
      setInstallPrompt(null);

      return choice.outcome;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[onboarding-checklist] install prompt failed", err);

      return "unavailable";
    }
  }, [installPrompt]);

  // A user is "installed" when we detect standalone display mode OR when
  // running inside the Tauri desktop shell OR when iOS marks the tab as
  // launched from the home screen.
  const isInstalled = isDesktopSurface || displayModeStandalone || checkIosStandalone();

  return {
    isInstalled,
    canPrompt: installPrompt !== null,
    prompt,
  };
}

// ---------------------------------------------------------------------------
// Pure helpers — kept out of the hook body so they read cleanly.
// ---------------------------------------------------------------------------

/** True when `(display-mode: standalone)` currently matches. SSR-safe. */
function checkDisplayMode(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  try {
    return window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

/**
 * iOS Safari sets a non-standard `navigator.standalone` boolean when the
 * user launched the PWA from the home screen. TypeScript's DOM lib doesn't
 * declare it, so we probe defensively.
 */
function checkIosStandalone(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const legacy = (navigator as { standalone?: boolean }).standalone;

  return legacy === true;
}
