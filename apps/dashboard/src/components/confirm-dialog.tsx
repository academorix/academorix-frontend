/**
 * @file confirm-dialog.tsx
 * @module components/confirm-dialog
 *
 * @description
 * The medium-danger confirmation shell per §7.4 — a modal that names the
 * target, describes what happens, and requires either a typed confirmation
 * (`typeToConfirm`) or a HoldConfirm press (`isDestructive`) before the
 * primary action fires.
 */

import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { useEffect, useState } from "react";

import type { ReactNode } from "react";

import { HoldConfirmButton } from "./hold-confirm-button";

type ConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Verb + target — e.g. `Delete athlete "Sara Al Zahra"`. */
  title: string;
  /** Two-sentence description of what happens and what is reversible. */
  description: ReactNode;
  /** Primary button label. */
  confirmLabel: string;
  /** When set, requires the user to type the string exactly before enabling the primary button. */
  typeToConfirm?: string;
  /** When true, wraps the primary button in `PressableFeedback.HoldConfirm`. */
  isDestructive?: boolean;
  /** Hold duration for destructive verbs (2s default, 4s for tenant-scale). */
  holdDuration?: number;
  onConfirm: () => void;
};

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  typeToConfirm,
  isDestructive,
  holdDuration = 2000,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const isTypedValid = !typeToConfirm || typed.trim() === typeToConfirm;

  useEffect(() => {
    if (!isOpen) setTyped("");
  }, [isOpen]);

  const handleConfirm = () => {
    if (!isTypedValid) return;
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <div className="text-sm leading-relaxed text-muted">{description}</div>
            {typeToConfirm ? (
              <TextField autoFocus aria-label="Type to confirm" value={typed} onChange={setTyped}>
                <Label>
                  Type <span className="font-medium text-foreground">{typeToConfirm}</span> to
                  confirm
                </Label>
                <Input placeholder={typeToConfirm} variant="secondary" />
              </TextField>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="ghost">
              Cancel
            </Button>
            {isDestructive ? (
              <HoldConfirmButton
                duration={holdDuration}
                icon="trash-bin"
                isDisabled={!isTypedValid}
                label={confirmLabel}
                onConfirm={handleConfirm}
              />
            ) : (
              <Button isDisabled={!isTypedValid} onPress={handleConfirm} variant="primary">
                {confirmLabel}
              </Button>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
