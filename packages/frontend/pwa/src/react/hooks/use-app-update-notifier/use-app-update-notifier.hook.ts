/**
 * @file use-app-update-notifier.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Watches the {@link useAppUpdate} state and dispatches
 *   HeroUI toasts on transitions.
 *
 *   Wires {@link AppUpdateService}'s reactive state to HeroUI's
 *   imperative `toast()` — the app tree stays clean, no wrapper
 *   component is needed. Callers already ship `<Toast.Provider />`
 *   at the app root for other toasts; this hook piggybacks on it.
 *
 *   Fires once per version transition:
 *   - `hasUpdate: false → true` — a fresh update is available.
 *   - `latest: 'x' → 'y'` — a newer update supersedes the one that
 *     was already toast-visible.
 *
 *   Mandatory updates use the `danger` variant + `timeout: 0` so
 *   they never auto-dismiss. Consumers still need to render a modal
 *   or block navigation for true mandatory-update UX; the toast is
 *   the notification affordance, not the enforcement mechanism.
 */

import { useEffect, useRef } from "react";
import { toast } from "@stackra/ui/react";

import { useAppUpdate } from "../use-app-update/use-app-update.hook";
import type { IUseAppUpdateNotifierOptions } from "./use-app-update-notifier.interface";

/**
 * Fire a HeroUI toast whenever the backend advertises a new app
 * release.
 *
 * @example
 * ```tsx
 * import { useAppUpdateNotifier } from '@stackra/pwa/react';
 *
 * function AppRoot() {
 *   // Mount the notifier once; it lives for the app's lifetime.
 *   useAppUpdateNotifier();
 *   return <MainRoutes />;
 * }
 * ```
 *
 * @example Custom copy
 * ```tsx
 * useAppUpdateNotifier({
 *   title: (latest) => (latest ? `v${latest} is out` : 'Update available'),
 *   description: (latest) => `Reload to get version ${latest}`,
 *   updateLabel: 'Reload',
 * });
 * ```
 */
export function useAppUpdateNotifier(options: IUseAppUpdateNotifierOptions = {}): void {
  const enabled = options.enabled ?? true;
  const { hasUpdate, latest, mandatory, accept } = useAppUpdate();

  // Track the last-notified `latest` version so we don't spam the
  // toast on every render. A fresh notification fires when
  //   - hasUpdate transitions to `true` from anything, AND
  //   - the `latest` version differs from the one we already toasted.
  const lastNotifiedRef = useRef<string | null>(null);
  // Track the open toast id so we can close it when the update flips
  // away (e.g. user accepts and downloads; app reloads).
  const openIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Not an update state — clear any prior toast reference.
    if (!hasUpdate) {
      lastNotifiedRef.current = null;
      openIdRef.current = null;
      return;
    }

    // Same version we already toasted — do not spam.
    const key = latest ?? "__unknown__";
    if (lastNotifiedRef.current === key) return;
    lastNotifiedRef.current = key;

    // Compute the message content.
    const resolvedTitle =
      typeof options.title === "function"
        ? options.title(latest)
        : (options.title ?? "App update available");

    const resolvedDescription = resolveDescription(options.description, latest);

    // Mandatory updates: force persistent + danger variant.
    const timeout = mandatory ? 0 : (options.timeout ?? 0);
    const variant: "danger" | "info" = mandatory ? "danger" : "info";

    // Dispatch. `toast` returns a key we could close on hasUpdate:false,
    // but the transition handling above already clears the ref so any
    // NEXT distinct version fires a fresh toast.
    const dispatcher = variant === "danger" ? toast.danger : toast.info;
    const id = dispatcher(resolvedTitle, {
      ...(resolvedDescription !== null ? { description: resolvedDescription } : {}),
      timeout,
      actionProps: {
        children: options.updateLabel ?? "Update now",
        onPress: () => {
          accept();
        },
      },
    });
    openIdRef.current = id;
    // NOTE: cleanup returning `toast.close(id)` would race with the
    // user's own dismiss action — HeroUI's queue handles staleness
    // internally.
  }, [
    enabled,
    hasUpdate,
    latest,
    mandatory,
    accept,
    options.title,
    options.description,
    options.updateLabel,
    options.timeout,
  ]);
}

/** Resolve the description option into a final string or null. */
function resolveDescription(
  description: IUseAppUpdateNotifierOptions["description"],
  latest: string | undefined,
): string | null {
  if (description === null) return null;
  if (description === undefined) {
    // Default copy.
    return latest
      ? `Version ${latest} is ready to install.`
      : "A newer version is ready to install.";
  }
  if (typeof description === "function") {
    return description(latest);
  }
  return description;
}
