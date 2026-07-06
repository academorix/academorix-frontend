/**
 * @file install-prompt.tsx
 * @module components/pwa/install-prompt
 *
 * @description
 * Client Component that captures the browser's `beforeinstallprompt`
 * event, defers it, and renders a HeroUI-styled surface asking the
 * visitor to install the marketing app to their home screen. The
 * prompt honours a dismissal cooldown (stored in `localStorage`) so
 * a "Not now" click is respected for a week.
 *
 * ## Cross-browser support
 *
 *  - Chromium (Chrome, Edge, Brave, Opera, Samsung Internet, Android
 *    Chrome, WebView) fires `beforeinstallprompt` and honours the
 *    deferred `prompt()`.
 *  - Safari (macOS + iOS) does NOT fire the event. iOS users install
 *    via Share → Add to Home Screen; this component simply doesn't
 *    render on Safari.
 *  - Firefox on desktop doesn't ship the API either. Users can
 *    install via the address-bar puzzle-piece icon.
 *
 * The RTL + i18n handling is inherited from the surrounding provider
 * stack (`NextIntlClientProvider` + `<html dir>`) — nothing locale-
 * specific lives in this file.
 */

"use client";

import { Button } from "@academorix/ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import type { ReactNode } from "react";

/**
 * The typed shape of the (still non-standard) `beforeinstallprompt`
 * event. Chromium types it privately; we declare it here so the
 * component doesn't reach for `any`.
 */
interface BeforeInstallPromptEvent extends Event {
  /** Show the browser's native install prompt. */
  readonly prompt: () => Promise<void>;
  /** Resolves once the user answers the prompt. */
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Local-storage key we write when the visitor dismisses the prompt.
 * The value is a UNIX timestamp (ms); we suppress the prompt for a
 * week after each dismissal.
 */
const DISMISS_KEY = "academorix:pwa:install-dismissed-at";

/** Cooldown before re-prompting after a dismissal. */
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** True when the visitor dismissed the prompt within the cooldown. */
function isInCooldown(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const stored = window.localStorage.getItem(DISMISS_KEY);

    if (!stored) return false;

    const dismissedAt = Number.parseInt(stored, 10);

    if (Number.isNaN(dismissedAt)) return false;

    return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  } catch {
    // Storage disabled (private mode) — treat as not-dismissed.
    return false;
  }
}

/** Persists the dismissal timestamp — best-effort. */
function markDismissed(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DISMISS_KEY, `${Date.now()}`);
  } catch {
    // Swallow — private mode, quota, etc.
  }
}

/** Bottom-sheet install prompt. Hidden by default. */
export function PwaInstallPrompt(): ReactNode {
  const t = useTranslations("pwa.install");

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInCooldown()) return;

    function onBeforeInstall(event: Event): void {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    }

    function onAppInstalled(): void {
      setIsVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsVisible(false);
    } else {
      markDismissed();
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback((): void => {
    markDismissed();
    setIsVisible(false);
    setDeferredPrompt(null);
  }, []);

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div
      aria-labelledby="pwa-install-title"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-default bg-background/95 p-5 shadow-xl backdrop-blur-md sm:inset-x-auto sm:end-6 sm:right-6 sm:bottom-6 sm:mx-0 rtl:sm:right-auto rtl:sm:left-6"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground" id="pwa-install-title">
            {t("title")}
          </h2>
          <p className="text-sm text-muted">{t("description")}</p>
        </div>
        <button
          aria-label={t("ariaClose")}
          className="rounded-md p-1 text-muted transition-colors hover:bg-default/40 hover:text-foreground"
          type="button"
          onClick={handleDismiss}
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="tertiary" onPress={handleDismiss}>
          {t("secondary")}
        </Button>
        <Button size="sm" variant="primary" onPress={() => void handleInstall()}>
          {t("primary")}
        </Button>
      </div>
    </div>
  );
}
