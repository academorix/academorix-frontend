/**
 * @file use-confirm-dialog.interface.ts
 * @module @stackra/ui/react/hooks/use-confirm-dialog
 * @description Interfaces for the useConfirmDialog hook.
 */

import type { ConfirmDialogVariant } from "../../components/confirm-dialog/confirm-dialog.interface";
import type { ReactNode } from "react";

// ============================================================================
// Hook Types
// ============================================================================

/** Options passed to the imperative `confirm()` function. */
export interface UseConfirmDialogOptions {
  /** Dialog title. */
  title: string;

  /** Description text. */
  description: string | ReactNode;

  /** Visual variant. */
  variant?: ConfirmDialogVariant;

  /** Confirm button label. */
  confirmLabel?: string;

  /** Cancel button label. */
  cancelLabel?: string;
}

/** Props object to spread on the ConfirmDialog component. */
export interface UseConfirmDialogProps {
  /** Whether the dialog is open. */
  open: boolean;

  /** Open state change handler. */
  onOpenChange: (open: boolean) => void;

  /** Dialog title. */
  title: string;

  /** Dialog description. */
  description: string | ReactNode;

  /** Visual variant. */
  variant: ConfirmDialogVariant;

  /** Confirm button label. */
  confirmLabel: string;

  /** Cancel button label. */
  cancelLabel: string;

  /** Confirm handler. */
  onConfirm: () => void | Promise<void>;

  /** Cancel handler. */
  onCancel: () => void;
}

/** Return value of the useConfirmDialog hook. */
export interface UseConfirmDialogReturn {
  /** Imperative function that opens the dialog and returns a boolean promise. */
  confirm: (options: UseConfirmDialogOptions) => Promise<boolean>;

  /** Props to spread on the ConfirmDialog component. */
  dialogProps: UseConfirmDialogProps;
}
