/**
 * @file confirm-dialog.interface.ts
 * @module @stackra/ui/react/components/confirm-dialog
 * @description Props interfaces for the ConfirmDialog component.
 */

import type { ReactNode } from "react";

// ============================================================================
// Component Props
// ============================================================================

/** Visual variant for the confirm dialog. */
export type ConfirmDialogVariant = "danger" | "warning" | "info";

/** Props for the ConfirmDialog component. */
export interface ConfirmDialogProps {
  /** Whether the dialog is open (controlled). */
  open: boolean;

  /** Callback when the open state changes. */
  onOpenChange: (open: boolean) => void;

  /** Dialog title. */
  title: string;

  /** Description text explaining what will happen. */
  description: string | ReactNode;

  /** Visual variant (determines button color). */
  variant?: ConfirmDialogVariant;

  /** Text for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;

  /** Text for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;

  /** Callback when user confirms the action. */
  onConfirm: () => void | Promise<void>;

  /** Callback when user cancels. Defaults to closing the dialog. */
  onCancel?: () => void;

  /** Whether the confirm action is in progress (shows loading state). */
  isLoading?: boolean;

  /** Additional CSS classes for the dialog. */
  className?: string;
}
