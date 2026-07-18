/**
 * @file hold-confirm-button.tsx
 * @module components/hold-confirm-button
 *
 * @description
 * The canonical destructive button shell per §7.4. Wraps HeroUI OSS `Button`
 * with HeroUI Pro `PressableFeedback.HoldConfirm` so every "Delete" verb
 * uses the same 2-second (default) hold-to-confirm interaction — no
 * accidental deletes.
 */

import { Button } from "@heroui/react";
import { PressableFeedback } from "@heroui-pro/react";

import type { ButtonProps } from "@heroui/react";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

type HoldConfirmButtonProps = Omit<ButtonProps, "onPress"> & {
  /** Fires only after the hold reaches `duration` — defaults to 2000ms. */
  onConfirm: () => void;
  /** Hold duration in ms. Defaults to 2000ms; use 4000ms for tenant-scale actions. */
  duration?: number;
  /** Iconify token (defaults to `trash-bin`). */
  icon?: string;
  /** Button label — repeated inside the hold overlay so users see it during the sweep. */
  label: string;
  /** Optional overlay label — defaults to `Hold to ${label.toLowerCase()}`. */
  overlayLabel?: ReactNode;
};

export function HoldConfirmButton({
  duration = 2000,
  icon = "trash-bin",
  label,
  overlayLabel,
  onConfirm,
  variant = "danger-soft",
  size = "sm",
  ...rest
}: HoldConfirmButtonProps) {
  return (
    <Button {...rest} size={size} variant={variant}>
      <PressableFeedback.HoldConfirm
        className="bg-danger text-danger-foreground"
        duration={duration}
        onComplete={onConfirm}
      >
        <Iconify className="size-4" icon={icon} />
        {overlayLabel ?? `Hold to ${label.toLowerCase()}`}
      </PressableFeedback.HoldConfirm>
      <Iconify className="size-4" icon={icon} />
      {label}
    </Button>
  );
}
