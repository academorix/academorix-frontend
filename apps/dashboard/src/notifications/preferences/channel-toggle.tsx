/**
 * @file channel-toggle.tsx
 * @module notifications/preferences/channel-toggle
 *
 * @description
 * A single row on the preferences page: a channel/category toggle
 * with a label and an optional "why is this always on?" note.
 *
 * ## Kept dumb on purpose
 *
 * All state (the current value, the mandatory-off state) is driven by
 * the parent so this component stays trivially unit-testable and can
 * be reused for the "quiet hours override per category" surface we
 * ship later.
 */

import { Switch } from "@academorix/ui/react";

import type { ReactNode } from "react";

/** Props for {@link ChannelToggle}. */
export interface ChannelToggleProps {
  /**
   * Stable id used for the underlying `Switch`'s `name` field and as
   * the `data-testid`. Should be unique across the whole form.
   */
  readonly id: string;
  /** Row label — human-readable, translation-ready. */
  readonly label: string;
  /**
   * Optional sub-label rendered under the primary label. Used for the
   * mandatory-on rows to explain why the toggle can't move.
   */
  readonly note?: string;
  /** Current on/off state. */
  readonly isEnabled: boolean;
  /**
   * When `true`, the switch is locked ON regardless of `isEnabled` and
   * shows the mandatory-on styling.
   *
   * @remarks
   * The mandatory case is why we don't lean on HTML's `disabled`
   * attribute for the whole row: we still want the switch to appear
   * selected + read-only rather than greyed out.
   */
  readonly isMandatoryOn?: boolean;
  /** Called when the user flips the switch. */
  readonly onChange: (next: boolean) => void;
}

/**
 * The atomic preferences row. Uses HeroUI's `Switch` compound
 * component (`Content` + `Control` + `Thumb`) rather than the
 * simpler flat API so we can host the description as a sibling
 * without breaking the click-target hitbox.
 */
export function ChannelToggle({
  id,
  label,
  note,
  isEnabled,
  isMandatoryOn = false,
  onChange,
}: ChannelToggleProps): ReactNode {
  return (
    <div
      className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-3"
      data-testid={`channel-toggle-${id}`}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {note ? <span className="mt-0.5 text-xs text-muted">{note}</span> : null}
      </div>
      <Switch
        aria-label={label}
        data-testid={`channel-toggle-switch-${id}`}
        isReadOnly={isMandatoryOn}
        isSelected={isMandatoryOn || isEnabled}
        name={id}
        onChange={(next) => {
          if (isMandatoryOn) {
            return;
          }

          onChange(next);
        }}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    </div>
  );
}
