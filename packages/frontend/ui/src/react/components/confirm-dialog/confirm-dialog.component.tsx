/**
 * @file confirm-dialog.component.tsx
 * @module @stackra/ui/react/components/confirm-dialog
 * @description Standardized confirmation dialog for destructive or important actions.
 *   Built on the HeroUI v3 `AlertDialog` compound API
 *   (`@heroui/react`). The component composes the canonical anatomy:
 *   `AlertDialog` → `AlertDialog.Backdrop` (owns the open state) →
 *   `AlertDialog.Container` → `AlertDialog.Dialog` → `Header` (with `Icon` and
 *   `Heading`) → `Body` → `Footer`.
 */

"use client";

import { AlertDialog, Button } from "@heroui/react";
import React, { useCallback, useState } from "react";

import type { ConfirmDialogProps, ConfirmDialogVariant } from "./confirm-dialog.interface";

/**
 * Map the public `variant` prop to a v3 `Button` `variant`.
 *
 * v3's `Button` has no native `warning` variant. We map `warning` to
 * `primary` and lean on `variantButtonClassName` to express the warning
 * visual via Tailwind utilities. `info` also maps to `primary` because v3
 * has no `info` variant either.
 */
const variantButtonVariant: Record<ConfirmDialogVariant, "danger" | "primary"> = {
  danger: "danger",
  warning: "primary",
  info: "primary",
};

/**
 * Extra `className` per variant applied to the confirm `Button`.
 *
 * Used to paint `variant="primary"` with warning tokens, since v3's
 * `Button` has no native warning variant. `danger` and `info` rely on the
 * native v3 variants and need no extra classes.
 */
const variantButtonClassName: Record<ConfirmDialogVariant, string | undefined> = {
  danger: undefined,
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
  info: undefined,
};

/**
 * Map the public `variant` prop to an `AlertDialog.Icon` `status`.
 *
 * The v3 `Icon` accepts `default | accent | success | warning | danger`,
 * so `info` is rendered as `accent` and `warning`/`danger` map 1:1.
 */
const variantIconStatus: Record<ConfirmDialogVariant, "danger" | "warning" | "accent"> = {
  danger: "danger",
  warning: "warning",
  info: "accent",
};

/**
 * ConfirmDialog — Standardized confirmation for destructive actions.
 *
 * Presents a modal dialog asking the user to confirm or cancel an action.
 * Supports async confirm handlers with loading state.
 *
 * The component uses the HeroUI v3 `AlertDialog` compound API. The open
 * state is owned by `AlertDialog.Backdrop` (`isOpen` / `onOpenChange`);
 * the root `AlertDialog` only accepts children. The confirm button uses
 * `isPending` (v3's loading prop, replacing the legacy `isLoading`) and
 * `variant` (replacing the legacy `color`).
 *
 * @param props - Component props.
 * @returns The confirm dialog element.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDelete}
 *   onOpenChange={setShowDelete}
 *   title="Delete Product"
 *   description="Are you sure you want to delete this product? This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 *   onConfirm={async () => {
 *     await deleteProduct(productId);
 *     toast.success('Product deleted');
 *   }}
 * />
 * ```
 */
export const ConfirmDialog = React.memo(function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "danger",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading: externalLoading,
  className,
}: ConfirmDialogProps): React.ReactElement {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;

  const handleConfirm = useCallback(async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  }, [onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  const dialogClassName = className ? `sm:max-w-[400px] ${className}` : "sm:max-w-[400px]";
  const confirmExtraClass = variantButtonClassName[variant];

  return (
    <AlertDialog data-component="confirm-dialog">
      <AlertDialog.Backdrop isOpen={open} onOpenChange={onOpenChange}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className={dialogClassName}>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status={variantIconStatus[variant]} />
              <AlertDialog.Heading>{title}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              {typeof description === "string" ? <p>{description}</p> : description}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button isDisabled={loading} variant="ghost" onPress={handleCancel}>
                {cancelLabel}
              </Button>
              <Button
                className={confirmExtraClass}
                isPending={loading}
                variant={variantButtonVariant[variant]}
                onPress={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
});

ConfirmDialog.displayName = "ConfirmDialog";
