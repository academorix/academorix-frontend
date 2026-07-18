/**
 * @file password-confirm.service.ts
 * @module @academorix/dashboard/services/password-confirm
 * @description Container-owned step-up gate.
 *
 *   Every settings-page destructive verb (revoke session, delete MFA
 *   method, rotate recovery codes, change email) needs the same modal
 *   chrome + password verification + toast. Rendering the modal per site
 *   inflates component code and forks the visual language. This service
 *   owns the imperative gate; a single `<PasswordConfirmDialog />` mount
 *   subscribes and renders the modal.
 *
 *   ## Migration note
 *
 *   Replaces the legacy `<PasswordConfirmProvider>` context in
 *   `apps/dashboard/src/providers/password-confirm-provider.tsx`. The
 *   public `usePasswordConfirm()` hook keeps the same signature — every
 *   existing caller migrates by swapping the import path.
 *
 *   ## Contract
 *
 *   `confirm(options)` returns a `Promise<boolean>` that:
 *
 *   - Resolves `true` when the user entered a password and the backend
 *     accepted it (the resolver is called by the mount component after a
 *     successful `POST /api/auth/confirm-password`).
 *   - Resolves `false` when the user cancels or dismisses the modal.
 *
 *   The service NEVER rejects — a network failure surfaces as an inline
 *   error inside the modal; only a genuine cancel/success closes the
 *   promise.
 */

import { Injectable, type OnApplicationShutdown } from "@stackra/container";

import type { IConfirmPasswordOptions, IPasswordConfirmSnapshot } from "./password-confirm.interface";

/** Stable empty snapshot — reused whenever the modal is closed. */
const CLOSED_SNAPSHOT: IPasswordConfirmSnapshot = { isOpen: false, options: null };

/**
 * Reactive step-up gate service.
 *
 * @example
 * ```tsx
 * // From a settings page action:
 * const confirmPassword = usePasswordConfirm();
 * const ok = await confirmPassword({
 *   title: "Revoke this session?",
 *   description: "Enter your password to confirm.",
 *   confirmLabel: "Revoke",
 *   variant: "danger",
 * });
 * if (!ok) return;
 * await authApi.revokeSession(id);
 * ```
 */
@Injectable()
export class PasswordConfirmService implements OnApplicationShutdown {
  #snapshot: IPasswordConfirmSnapshot = CLOSED_SNAPSHOT;

  readonly #listeners = new Set<() => void>();

  /**
   * The active resolver — set by {@link confirm} when a prompt opens,
   * called by {@link resolve} + {@link cancel} to complete the awaited
   * Promise. Kept in a private field (not a listener bag) because the
   * gate is single-user: opening a second prompt while the first is
   * pending cancels the first.
   */
  #resolver: ((result: boolean) => void) | null = null;

  /**
   * Fired when the container tears down. Resolves any pending prompt
   * with `false` so awaited callers unblock cleanly, and clears every
   * subscriber. Idempotent.
   */
  public onApplicationShutdown(): void {
    this.#resolver?.(false);
    this.#resolver = null;
    this.#listeners.clear();
    this.#snapshot = CLOSED_SNAPSHOT;
  }

  /**
   * Subscribe to snapshot changes — the mount component calls this via
   * `useSyncExternalStore` to re-render on open/close.
   *
   * @param listener - Callback invoked on every mutation.
   * @returns Unsubscriber.
   */
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);

    return (): void => {
      this.#listeners.delete(listener);
    };
  };

  /** Current snapshot. Stable object identity between mutations. */
  public readonly getSnapshot = (): IPasswordConfirmSnapshot => this.#snapshot;

  /**
   * Open a confirm-password prompt. Resolves when the user completes
   * the flow.
   *
   * If a prompt is already open, this cancels the previous prompt with
   * `false` before opening the new one. Callers should not rely on this
   * behaviour — the settings pages never fire two prompts in parallel.
   *
   * @param options - Prompt options (title, description, ...).
   * @returns `true` if verified, `false` if cancelled/dismissed.
   */
  public readonly confirm = (options: IConfirmPasswordOptions): Promise<boolean> => {
    // Reject any in-flight resolver — a second `confirm()` call while
    // the first is pending would otherwise leak the earlier Promise
    // forever. We resolve `false` (not throw) so the caller's awaited
    // control flow treats the pre-empted prompt as a cancel.
    this.#resolver?.(false);
    this.#resolver = null;

    this.#snapshot = { isOpen: true, options };
    this.#emit();

    return new Promise<boolean>((resolve) => {
      this.#resolver = resolve;
    });
  };

  /**
   * Complete the active prompt with `true` — called by the mount
   * component after `POST /api/auth/confirm-password` succeeds. Closes
   * the modal.
   */
  public readonly resolve = (): void => {
    // Guard: without an active resolver this is a bug in the mount
    // component (a resolve without an open prompt). Silently no-op —
    // the wrong call shouldn't crash the tree.
    if (this.#resolver === null) {
      return;
    }

    const resolver = this.#resolver;

    this.#resolver = null;
    this.#snapshot = CLOSED_SNAPSHOT;
    this.#emit();
    resolver(true);
  };

  /**
   * Complete the active prompt with `false` — called by the mount
   * component when the user cancels or dismisses the modal. Closes it.
   */
  public readonly cancel = (): void => {
    if (this.#resolver === null) {
      return;
    }

    const resolver = this.#resolver;

    this.#resolver = null;
    this.#snapshot = CLOSED_SNAPSHOT;
    this.#emit();
    resolver(false);
  };

  /** Notify subscribers. Errors bubble — a bad subscriber is a bug. */
  #emit(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}
