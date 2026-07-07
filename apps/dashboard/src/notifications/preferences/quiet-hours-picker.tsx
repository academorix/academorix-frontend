/**
 * @file quiet-hours-picker.tsx
 * @module notifications/preferences/quiet-hours-picker
 *
 * @description
 * Editor for the {@link QuietHoursWindow} object (`start`, `end`,
 * `timezone`). Uses the native `<input type="time">` for the two
 * boundaries — HeroUI does not ship a TimeField that speaks 24-hour
 * wall-clock strings without JS acrobatics, and the native input is
 * already keyboard + locale friendly.
 *
 * ## Timezone picker
 *
 * A native `<select>` limited to the small set of IANA zones the
 * academies we ship to use. When the backend endpoint lands we swap
 * this for a searchable combo box seeded by
 * `Intl.supportedValuesOf("timeZone")`.
 *
 * TODO(backend-gap): PUT /notification-preferences — endpoint does NOT
 *   exist yet. See Communication module. Payload:
 *   `{ quiet_hours: { start, end, timezone } | {} }`.
 */

import { Input, Label, TextField } from "@academorix/ui/react";

import type { QuietHoursWindow } from "@academorix/notifications";
import type { ChangeEvent, ReactNode } from "react";

/** Props for {@link QuietHoursPicker}. */
export interface QuietHoursPickerProps {
  /**
   * The current window, or `null` for "no quiet hours set". Passing
   * `null` renders the picker with sensible defaults but keeps the
   * "enabled" hint muted.
   */
  readonly value: QuietHoursWindow | null;
  /** Called whenever any of the three fields changes. */
  readonly onChange: (next: QuietHoursWindow) => void;
  /** Optional list of allowed timezones (defaults to a small preset). */
  readonly timezones?: readonly string[];
}

/**
 * The zones we ship as first-class options. Kept intentionally short
 * — the current tenants are all in Europe, MENA, or East Africa.
 * When we grow, swap for `Intl.supportedValuesOf("timeZone")`.
 */
const DEFAULT_TIMEZONES: readonly string[] = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Africa/Cairo",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "America/New_York",
];

/**
 * Renders the quiet-hours editor. Never dispatches without a full,
 * well-formed {@link QuietHoursWindow} — so the parent can wire the
 * result straight into a mutation payload.
 */
export function QuietHoursPicker({
  value,
  onChange,
  timezones = DEFAULT_TIMEZONES,
}: QuietHoursPickerProps): ReactNode {
  const current: QuietHoursWindow = value ?? {
    start: "22:00",
    end: "07:00",
    timezone: "UTC",
  };

  const handleStart = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ ...current, start: event.target.value });
  };

  const handleEnd = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ ...current, end: event.target.value });
  };

  const handleTimezone = (event: ChangeEvent<HTMLSelectElement>): void => {
    onChange({ ...current, timezone: event.target.value });
  };

  return (
    <div
      className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-3"
      data-testid="quiet-hours-picker"
    >
      <TextField className="w-full" name="quiet_hours_start" type="time">
        <Label>From</Label>
        {/*
         * HeroUI's `Input` under a `type="time"` `TextField` still
         * renders the native picker — we just get its styling for
         * free. The `value`/`onChange` land on the underlying input.
         */}
        <Input
          aria-label="Quiet hours start"
          data-testid="quiet-hours-start"
          type="time"
          value={current.start}
          variant="secondary"
          onChange={handleStart}
        />
      </TextField>
      <TextField className="w-full" name="quiet_hours_end" type="time">
        <Label>To</Label>
        <Input
          aria-label="Quiet hours end"
          data-testid="quiet-hours-end"
          type="time"
          value={current.end}
          variant="secondary"
          onChange={handleEnd}
        />
      </TextField>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground" htmlFor="quiet-hours-timezone">
          Timezone
        </label>
        <select
          className="h-10 rounded-lg border border-border bg-default px-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          data-testid="quiet-hours-timezone"
          id="quiet-hours-timezone"
          value={current.timezone}
          onChange={handleTimezone}
        >
          {timezones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
