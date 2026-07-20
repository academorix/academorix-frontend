/**
 * @file channel-toggle.component.tsx
 * @module @stackra/notifications/react/components/preferences
 * @description A single channel/category toggle row.
 *
 *   Uses HeroUI's `Switch` compound (`Content` + `Control` + `Thumb`)
 *   — the label sits as sibling text under the primary row so the
 *   click target hitbox stays broad. Mandatory-on rows render the
 *   switch as read-only.
 */

import type { ReactElement } from "react";
import { Switch } from "@stackra/ui/react";

import type { ChannelToggleProps } from "./channel-toggle.interface";

/**
 * Channel toggle row.
 *
 * @example
 * ```tsx
 * <ChannelToggle
 *   id="operational.in-app"
 *   label="In-app"
 *   isEnabled={true}
 *   onChange={(next) => save(next)}
 * />
 * ```
 */
export function ChannelToggle({
  id,
  label,
  note,
  isEnabled,
  isMandatoryOn = false,
  onChange,
}: ChannelToggleProps): ReactElement {
  return (
    <div
      className="border-border bg-surface flex items-start justify-between gap-4 rounded-xl border p-3"
      data-notifications-channel-toggle={id}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-foreground text-sm font-medium">{label}</span>
        {note ? <span className="text-muted mt-0.5 text-xs">{note}</span> : null}
      </div>
      <Switch
        aria-label={label}
        name={id}
        isSelected={isMandatoryOn || isEnabled}
        isReadOnly={isMandatoryOn}
        onChange={(next) => {
          if (isMandatoryOn) return;
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
