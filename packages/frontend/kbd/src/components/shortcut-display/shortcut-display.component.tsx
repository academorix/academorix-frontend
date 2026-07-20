/**
 * @fileoverview ShortcutDisplay — platform-aware shortcut badge.
 *
 * Renders a keyboard shortcut using HeroUI's `Kbd` component with
 * platform-aware formatting powered by TanStack Hotkeys'
 * `formatForDisplay`.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { type ReactElement } from "react";
import { Kbd } from "@stackra/ui/react";

import type { KeyCombo } from "../../interfaces/key-combo.interface";
import { formatCombo } from "../../utils/format-combo.util";

/**
 * Props for the {@link ShortcutDisplay} component.
 */
export interface ShortcutDisplayProps {
  /** The combo to display. */
  combo: KeyCombo | KeyCombo[];
  /** Additional CSS class. */
  className?: string;
  /** Size variant. */
  size?: "sm" | "md" | "lg";
}

/**
 * Renders a keyboard shortcut as a styled badge.
 *
 * Automatically formats the combo for the current platform
 * (⌘K on Mac, Ctrl+K on Windows).
 *
 * @example
 * ```tsx
 * <ShortcutDisplay combo={{ mod: true, key: "k" }} />
 * // Mac: ⌘K  |  Windows: Ctrl+K
 *
 * <ShortcutDisplay combo={{ sequence: ["g", "p"] }} />
 * // G P
 * ```
 */
export function ShortcutDisplay({
  combo,
  className,
  size = "sm",
}: ShortcutDisplayProps): ReactElement {
  const combos = Array.isArray(combo) ? combo : [combo];

  return (
    <span className={["inline-flex items-center gap-1", className].filter(Boolean).join(" ")}>
      {combos.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && <span className="text-default-400 text-xs mx-0.5">/</span>}
          <Kbd className={resolveKbdSize(size)}>
            <Kbd.Content>{formatCombo(c)}</Kbd.Content>
          </Kbd>
        </span>
      ))}
    </span>
  );
}

function resolveKbdSize(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return "text-[10px]";
    case "lg":
      return "text-sm";
    default:
      return "text-xs";
  }
}
