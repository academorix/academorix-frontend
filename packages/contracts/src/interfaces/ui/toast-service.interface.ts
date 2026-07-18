/**
 * @file toast-service.interface.ts
 * @module @stackra/contracts/interfaces/ui
 * @description Imperative toast surface for `@stackra/ui`.
 */

/**
 * Imperative toast surface — thin wrapper around HeroUI's `toast(...)`.
 *
 * Bound under `TOAST_SERVICE`. Consumed by the `ToastHandler` from
 * `@stackra/ui/actions` and by any code that wants to fire a toast without
 * a component tree.
 */
export interface IToastService {
  show(
    title: string,
    options?: {
      description?: string;
      variant?: "accent" | "success" | "warning" | "danger";
      duration?: number;
    },
  ): void;
}
