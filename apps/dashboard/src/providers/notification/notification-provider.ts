/**
 * @file notification-provider.ts
 * @module providers/notification/notification-provider
 *
 * @description
 * Bridges Refine's notification system to HeroUI's imperative `toast` API.
 *
 * Refine calls `open()` for successes, errors, and — in *undoable* mutation
 * mode — a `"progress"` toast with a cancel action and countdown. It later
 * calls `close(key)` using **its own** key. HeroUI's `toast()` returns its
 * **own** key, so we keep a small map from Refine keys → HeroUI keys to honour
 * `close()` correctly.
 *
 * A `<ToastProvider>` must be mounted once at the app root (see
 * `src/providers.tsx`) for these toasts to render.
 */

import { toast } from "@stackra/ui/react";

import type { NotificationProvider, OpenNotificationParams } from "@refinedev/core";

/**
 * Maps Refine notification keys to the HeroUI toast keys `toast()` returns, so
 * `close(refineKey)` can dismiss the correct toast.
 */
const keyMap = new Map<string, string>();

/**
 * Normalises Refine's `undoableTimeout` to milliseconds. Refine expresses the
 * countdown in seconds (e.g. `5`), but we defensively treat large values as
 * already-milliseconds so either convention works.
 */
function resolveTimeoutMs(undoableTimeout?: number): number {
  const value = undoableTimeout ?? 5;

  return value < 100 ? value * 1000 : value;
}

/** Records the HeroUI key for a Refine key when one is provided. */
function remember(refineKey: string | undefined, heroKey: string): void {
  if (refineKey) {
    keyMap.set(refineKey, heroKey);
  }
}

/**
 * Refine notification provider backed by HeroUI toasts.
 *
 * - `type: "success"` → green success toast.
 * - `type: "error"`   → red danger toast.
 * - `type: "progress"`→ neutral toast with an "Undo" action, auto-dismissing
 *   after the undoable timeout (at which point the mutation commits).
 */
export const notificationProvider: NotificationProvider = {
  open: ({
    key,
    message,
    description,
    type,
    cancelMutation,
    undoableTimeout,
  }: OpenNotificationParams): void => {
    if (type === "progress") {
      // Refine re-emits the progress notification every second to animate a
      // countdown; ignore repeats so we don't stack duplicate toasts.
      if (key && keyMap.has(key)) {
        return;
      }

      const heroKey = toast(message, {
        description,
        timeout: resolveTimeoutMs(undoableTimeout),
        actionProps: cancelMutation
          ? { children: "Undo", onPress: () => cancelMutation() }
          : undefined,
      });

      remember(key, heroKey);

      return;
    }

    if (type === "success") {
      remember(key, toast.success(message, { description }));

      return;
    }

    remember(key, toast.danger(message, { description }));
  },

  close: (key: string): void => {
    const heroKey = keyMap.get(key);

    if (heroKey) {
      toast.close(heroKey);
      keyMap.delete(key);
    }
  },
};
