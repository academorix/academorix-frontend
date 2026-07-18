/**
 * @file toast.service.ts
 * @module @stackra/ui/actions/services
 * @description ToastService — pluggable imperative toast surface.
 *
 *   The `show()` method invokes every registered listener. HeroUI's
 *   `<ToastProvider>` (or the app's toast host) subscribes to receive
 *   toasts; the default fallback logs to `console.info`.
 */

import { Injectable } from "@stackra/container";
import type { IToastService } from "@stackra/contracts";

/** A subscriber that renders a toast when notified. */
export type ToastListener = (
  title: string,
  options: {
    description?: string;
    variant?: "accent" | "success" | "warning" | "danger";
    duration?: number;
  },
) => void;

/**
 * ToastService — pluggable imperative toast surface.
 */
@Injectable()
export class ToastService implements IToastService {
  private readonly listeners = new Set<ToastListener>();

  /**
   * Register a toast listener (typically a HeroUI toast provider).
   *
   * @returns Unsubscribe function.
   */
  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Show a toast. Notifies every registered listener; falls back to
   * `console.info` when no listener is subscribed.
   */
  public show(
    title: string,
    options: {
      description?: string;
      variant?: "accent" | "success" | "warning" | "danger";
      duration?: number;
    } = {},
  ): void {
    if (this.listeners.size === 0) {
      // Fail-open: development / test environments without a toast host
      // still see the toast so misconfigurations are visible.
      // eslint-disable-next-line no-console
      console.info(`[toast] ${title}`, options);
      return;
    }
    for (const listener of this.listeners) {
      try {
        listener(title, options);
      } catch {
        // Never let one listener break the others.
      }
    }
  }
}
