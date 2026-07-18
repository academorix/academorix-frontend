/**
 * @file quiet-hours-picker.component.tsx
 * @module @stackra/notifications/native/components/preferences
 * @description Native editor for the {@link IQuietHoursWindow} tuple.
 *
 *   Native has no equivalent of the web `<input type="time">`; the
 *   simplest cross-platform surface is two `Input` fields where the
 *   user types `HH:mm` values, plus a HeroUI Native `Select` for
 *   the timezone.
 *
 *   Native has no `ComboBox` primitive — `Select` is the accepted
 *   fallback per the ui-components rule ("use the matching HeroUI
 *   component"). A future revision can switch to Native Pro's
 *   `TimePicker` wheel once `@internationalized/date` becomes a
 *   base peer of the notifications native surface.
 */

import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { Input, Label, Select, TextField } from '@stackra/ui/native';

import { DEFAULT_TIMEZONES } from '@/core/constants';
import type { IQuietHoursWindow } from '@/core/interfaces';

import type { QuietHoursPickerProps } from './quiet-hours-picker.interface';

/** Fallback window rendered when the caller passes `value === null`. */
const FALLBACK_WINDOW: IQuietHoursWindow = {
  start: '22:00',
  end: '07:00',
  timezone: 'UTC',
};

/**
 * A single timezone `SelectOption` shape — matches HeroUI Native's
 * primitive shape (`{ value, label }`).
 */
interface ITimezoneOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Native quiet-hours editor.
 *
 * @example
 * ```tsx
 * const [w, setW] = useState<IQuietHoursWindow | null>(null);
 * <QuietHoursPicker value={w} onChange={setW} />
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
    () => timezones.map((zone) => ({ value: zone, label: zone })),
    [timezones]
  );

  const handleStart = (next: string): void => {
    onChange({ ...current, start: next });
  };

  const handleEnd = (next: string): void => {
    onChange({ ...current, end: next });
  };

  const handleTimezone = (option: ITimezoneOption | ITimezoneOption[] | undefined): void => {
    // `Select`'s `onValueChange` in single mode delivers a single
    // `SelectOption`; `Array.isArray` guard mirrors the primitive's
    // shape so we can pass the same handler through multiple modes
    // in a later revision.
    if (!option || Array.isArray(option)) return;
    onChange({ ...current, timezone: option.value });
  };

  return (
    <View
      className={`gap-3 rounded-xl border border-border bg-surface p-3${className ? ` ${className}` : ''}`}
    >
      <TextField>
        <Label>
          <Label.Text>From</Label.Text>
        </Label>
        <Input
          accessibilityLabel="Quiet hours start"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          placeholder="22:00"
          value={current.start}
          onChangeText={handleStart}
        />
      </TextField>

      <TextField>
        <Label>
          <Label.Text>To</Label.Text>
        </Label>
        <Input
          accessibilityLabel="Quiet hours end"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          placeholder="07:00"
          value={current.end}
          onChangeText={handleEnd}
        />
      </TextField>

      <View>
        <Label>
          <Label.Text>Timezone</Label.Text>
        </Label>
        <Select
          value={{ value: current.timezone, label: current.timezone }}
          onValueChange={handleTimezone}
        >
          <Select.Trigger>
            <Select.Value placeholder="Choose a timezone" />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover">
              {timezoneOptions.map((option) => (
                <Select.Item key={option.value} label={option.label} value={option.value}>
                  <Select.ItemLabel />
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      </View>
    </View>
  );
}
