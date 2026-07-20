/**
 * @file quiet-hours-picker.component.tsx
 * @module @stackra/notifications/react/components/preferences
 * @description Editor for the {@link IQuietHoursWindow} tuple.
 *
 *   Two native `<input type="time">` fields for the start / end
 *   boundaries (HeroUI's `Input` accepts a `type` prop and
 *   compiles to the same native picker) plus a HeroUI `ComboBox`
 *   over the timezone list — the workspace ui-components rule
 *   prefers ComboBox over Select for single-choice pickers.
 */

import { useMemo, type ChangeEvent, type ReactElement } from 'react';
import { ComboBox, Input, Label, ListBox, TextField } from '@stackra/ui/react';

import { DEFAULT_TIMEZONES } from '@/core/constants';
import type { IQuietHoursWindow } from '@/core/interfaces';
import type { QuietHoursPickerProps } from './quiet-hours-picker.interface';

/** A single timezone row for the `ComboBox`. */
interface ITimezoneOption {
  readonly id: string;
  readonly label: string;
}

/** The fallback window rendered when `value === null`. */
const FALLBACK_WINDOW: IQuietHoursWindow = {
  start: '22:00',
  end: '07:00',
  timezone: 'UTC',
};

/**
 * Quiet-hours editor.
 *
 * @example
 * ```tsx
 * const [window, setWindow] = useState<IQuietHoursWindow | null>(null);
 * <QuietHoursPicker value={window} onChange={setWindow} />
 * ```
 */
export function QuietHoursPicker({
  value,
  onChange,
  timezones = DEFAULT_TIMEZONES,
  className,
}: QuietHoursPickerProps): ReactElement {
  const current = value ?? FALLBACK_WINDOW;

  const timezoneOptions = useMemo<readonly ITimezoneOption[]>(
    () => timezones.map((zone) => ({ id: zone, label: zone })),
    [timezones]
  );

  const handleStart = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ ...current, start: event.target.value });
  };

  const handleEnd = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ ...current, end: event.target.value });
  };

  const handleTimezone = (key: unknown): void => {
    if (key == null) return;
    onChange({ ...current, timezone: String(key) });
  };

  return (
    <div
      className={`grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-3${className ? ` ${className}` : ''}`}
      data-notifications-quiet-hours=""
    >
      <TextField name="quiet_hours_start" className="w-full">
        <Label>From</Label>
        <Input
          aria-label="Quiet hours start"
          type="time"
          value={current.start}
          onChange={handleStart}
          data-notifications-quiet-hours-start=""
        />
      </TextField>
      <TextField name="quiet_hours_end" className="w-full">
        <Label>To</Label>
        <Input
          aria-label="Quiet hours end"
          type="time"
          value={current.end}
          onChange={handleEnd}
          data-notifications-quiet-hours-end=""
        />
      </TextField>
      <ComboBox
        selectedKey={current.timezone}
        onSelectionChange={handleTimezone}
        menuTrigger="focus"
        aria-label="Quiet hours timezone"
        data-notifications-quiet-hours-timezone=""
      >
        <Label>Timezone</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search timezone..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox items={timezoneOptions}>
            {(item) => (
              <ListBox.Item id={item.id} textValue={item.label}>
                {item.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </div>
  );
}
