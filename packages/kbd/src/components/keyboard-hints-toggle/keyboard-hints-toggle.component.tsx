/**
 * @fileoverview KeyboardHintsToggle — icon toggle for the hints overlay.
 *
 * Reads / writes the {@link KeyboardHintsService} so the trigger
 * stays in sync with the keyboard shortcut and any other UI that
 * controls the overlay.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { type ReactElement } from "react";
import { Button } from "@stackra/ui/react";

import type { KeyboardHintsToggleProps } from "../../interfaces/keyboard-hints-toggle-props.interface";
import { useKeyboardHints } from "../../hooks/use-keyboard-hints/use-keyboard-hints.hook";

/**
 * Icon toggle for the on-screen hints overlay.
 */
export function KeyboardHintsToggle({
  className,
  ariaLabel = "Toggle keyboard hints",
}: KeyboardHintsToggleProps): ReactElement {
  const { visible, toggle } = useKeyboardHints();
  return (
    <Button
      variant={visible ? "secondary" : "ghost"}
      size="sm"
      isIconOnly
      onPress={toggle}
      className={className}
      aria-pressed={visible}
      aria-label={ariaLabel}
    >
      <Icon />
    </Button>
  );
}

function Icon(): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M2 12h2m4 0h2m4 0h6" />
      <path d="M2 6h6m4 0h2m4 0h4" />
      <path d="M2 18h4m4 0h6m4 0h2" />
    </svg>
  );
}
