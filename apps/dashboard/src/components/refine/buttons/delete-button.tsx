/**
 * @file delete-button.tsx
 * @module components/refine/buttons/delete-button
 *
 * @description
 * Deletes a record after an inline confirmation popover. Built on
 * `useDeleteButton`, which resolves the localized confirm copy, the
 * access-control `hidden`/`disabled` flags, the `loading` state, and the
 * `onConfirm` handler. When the app runs in **undoable** mutation mode, the
 * actual delete is deferred and surfaced through the notification provider's
 * "Undo" toast — this button just triggers it.
 */

import { TrashIcon } from "@academorix/ui/icons/outline";
import { Button, Popover } from "@academorix/ui/react";
import { useDeleteButton } from "@refinedev/core";
import { useState } from "react";

import type { ButtonPassthroughProps } from "@/components/refine/buttons/nav-button";
import type { BaseKey } from "@refinedev/core";
import type { ReactNode } from "react";

/** Props for {@link DeleteButton}. */
export interface DeleteButtonProps extends ButtonPassthroughProps {
  /** Resource name; defaults to the resource inferred from the route. */
  resource?: string;
  /** Record id to delete; defaults to the `:id` route param. */
  recordItemId?: BaseKey;
  /** Target data provider name. */
  dataProviderName?: string;
  /** Access-control behaviour (enable the check, hide when unauthorized). */
  accessControl?: { enabled?: boolean; hideIfUnauthorized?: boolean };
  /** Extra params for the mutation. */
  meta?: Record<string, unknown>;
  /** Overrides the default icon + label content on the trigger. */
  children?: ReactNode;
}

/**
 * A danger button that confirms in a popover before deleting the record.
 * Returns `null` when the caller lacks delete permission.
 *
 * @param props - Resource, record id, access-control, and button passthrough.
 */
export function DeleteButton({
  resource,
  recordItemId,
  dataProviderName,
  accessControl,
  meta,
  children,
  ...buttonProps
}: DeleteButtonProps): ReactNode {
  const { onConfirm, label, hidden, disabled, loading, confirmTitle, confirmOkLabel, cancelLabel } =
    useDeleteButton({
      resource,
      id: recordItemId,
      dataProviderName,
      accessControl,
      meta,
    });

  const [isOpen, setIsOpen] = useState(false);

  if (hidden) {
    return null;
  }

  const handleConfirm = (): void => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button isDisabled={disabled || loading} variant="danger" {...buttonProps}>
        {children ?? (
          <>
            <TrashIcon aria-hidden="true" className="size-4" />
            {buttonProps.isIconOnly ? null : label}
          </>
        )}
      </Button>

      <Popover.Content className="max-w-72" placement="bottom end">
        <Popover.Dialog>
          <Popover.Heading>{confirmTitle}</Popover.Heading>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="tertiary" onPress={() => setIsOpen(false)}>
              {cancelLabel}
            </Button>
            <Button isDisabled={loading} size="sm" variant="danger" onPress={handleConfirm}>
              {confirmOkLabel}
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
