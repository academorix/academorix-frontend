/**
 * @file password-confirm.interface.ts
 * @module @academorix/dashboard/services/password-confirm
 * @description Data-plane types for {@link PasswordConfirmService}.
 *
 *   `IConfirmPasswordOptions` is the input the imperative `confirm()` call
 *   accepts. `IPasswordConfirmSnapshot` is the reactive state the mount
 *   component reads via `useSyncExternalStore` to render the modal.
 */

import type { ReactNode } from "react";

/**
 * Options accepted by a single confirm-password prompt.
 *
 * Kept identical to the legacy `ConfirmPasswordOptions` from
 * `providers/password-confirm-provider.tsx` so every call site
 * migrates without editing arguments.
 */
export interface IConfirmPasswordOptions {
  /** Modal title. Short, actionable — e.g. "Revoke this session?" */
  title: string;
  /** Long-form description explaining what's about to happen. */
  description?: ReactNode;
  /** Confirm-button label. Defaults to `"Confirm"` at render time. */
  confirmLabel?: string;
  /** Button variant; `"danger"` for destructive verbs. */
  variant?: "primary" | "danger";
  /** Iconify token rendered next to the title. */
  icon?: string;
}

/**
 * Reactive snapshot emitted by the service. `isOpen === false` means the
 * modal is closed; every other field is only meaningful when it's `true`.
 */
export interface IPasswordConfirmSnapshot {
  /** Whether a confirm modal is currently open. */
  readonly isOpen: boolean;
  /** The options passed to the active prompt, if any. */
  readonly options: IConfirmPasswordOptions | null;
}
