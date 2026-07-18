/**
 * @file mock-toast-service.ts
 * @module @stackra/ui/testing
 * @description In-memory `IToastService` implementation for tests.
 *
 *   Records every `show()` invocation on `.toasts` for assertions. No
 *   HeroUI provider, no DOM — safe for headless unit tests.
 */

import type { IToastService } from "@stackra/contracts";

/** A single recorded toast. */
export interface RecordedToast {
  title: string;
  description?: string;
  variant?: "accent" | "success" | "warning" | "danger";
  duration?: number;
  shownAt: number;
}

/**
 * In-memory toast service for testing.
 *
 * Mirrors the `IToastService` contract so it can be registered under
 * `TOAST_SERVICE` in tests as a drop-in replacement for the real
 * `ToastService`.
 *
 * @example
 * ```ts
 * const toast = new MockToastService();
 * toast.show('Saved.', { variant: 'success' });
 * expect(toast.toasts).toHaveLength(1);
 * expect(toast.last?.title).toBe('Saved.');
 * ```
 */
export class MockToastService implements IToastService {
  /** Every toast shown, in chronological order. */
  public readonly toasts: RecordedToast[] = [];

  public show(
    title: string,
    options: {
      description?: string;
      variant?: "accent" | "success" | "warning" | "danger";
      duration?: number;
    } = {},
  ): void {
    this.toasts.push({
      title,
      description: options.description,
      variant: options.variant,
      duration: options.duration,
      shownAt: Date.now(),
    });
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** The most recently shown toast, or `undefined`. */
  public get last(): RecordedToast | undefined {
    return this.toasts.at(-1);
  }

  /** Every toast of the given variant. */
  public getByVariant(variant: RecordedToast["variant"]): RecordedToast[] {
    return this.toasts.filter((t) => t.variant === variant);
  }

  /** Drop the toast ledger. */
  public reset(): void {
    this.toasts.length = 0;
  }
}
