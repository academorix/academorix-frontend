/**
 * @fileoverview CommandTrigger — search-style button that opens the palette.
 *
 * Drop-in replacement for static "Press Cmd+K to search" affordances.
 * Renders a HeroUI `Button` with the configured combo shown via
 * {@link KeyboardShortcut}.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { type ReactElement } from "react";
import { Button, IconSearch } from "@stackra/ui/react";

import type { CommandTriggerProps } from "../../interfaces/command-trigger-props.interface";
import { useCommandPalette } from "../../hooks/use-command-palette/use-command-palette.hook";

import { KeyboardShortcut } from "./../keyboard-shortcut/keyboard-shortcut.component";
import { useI18n } from "@stackra/i18n/react";

/**
 * Search-style trigger for the command palette.
 */
export function CommandTrigger({
  combo = { mod: true, key: "k" },
  label,
  className,
}: CommandTriggerProps): ReactElement {
  const { t } = useI18n();
  const { open } = useCommandPalette();
  const resolvedLabel = label ?? t("kbd.components.command_trigger.search");

  return (
    <Button
      variant="tertiary"
      size="sm"
      onPress={() => open()}
      className={className}
      aria-label={`${resolvedLabel} (${combo.key})`}
      data-shortcut={JSON.stringify(combo)}
      data-shortcut-description={resolvedLabel}
    >
      <IconSearch className="size-4" />
      <span>{resolvedLabel}</span>
      <KeyboardShortcut combo={combo} />
    </Button>
  );
}
