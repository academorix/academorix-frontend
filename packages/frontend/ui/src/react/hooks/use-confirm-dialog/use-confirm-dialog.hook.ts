/**
 * @file use-confirm-dialog.hook.ts
 * @module @stackra/ui/react/hooks/use-confirm-dialog
 * @description Imperative confirmation dialog hook.
 *   Opens a ConfirmDialog and returns a Promise that resolves to true/false.
 */

"use client";

import { useState, useCallback, useRef } from "react";

import type {
  UseConfirmDialogOptions,
  UseConfirmDialogReturn,
} from "./use-confirm-dialog.interface";

/**
 * Imperative confirmation dialog hook.
 *
 * Returns a `confirm()` function that opens a dialog and resolves
 * a Promise with the user's decision (true = confirmed, false = cancelled).
 *
 * @returns Dialog state and imperative `confirm()` function.
 *
 * @example
 * ```tsx
 * const { confirm, dialogProps } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Product',
 *     description: 'This action cannot be undone.',
 *     variant: 'danger',
 *     confirmLabel: 'Delete',
 *   });
 *
 *   if (confirmed) {
 *     await deleteProduct(id);
 *   }
 * };
 *
 * return (
 *   <>
 *     <Button onPress={handleDelete}>Delete</Button>
 *     <ConfirmDialog {...dialogProps} />
 *   </>
 * );
 * ```
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmDialogOptions>({
    title: "",
    description: "",
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: UseConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resolveRef.current?.(false);
      resolveRef.current = null;
    }
  }, []);

  return {
    confirm,
    dialogProps: {
      open,
      onOpenChange: handleOpenChange,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "danger",
      confirmLabel: options.confirmLabel ?? "Confirm",
      cancelLabel: options.cancelLabel ?? "Cancel",
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
