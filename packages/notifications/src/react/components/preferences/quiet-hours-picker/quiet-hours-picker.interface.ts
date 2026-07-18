/**
 * @file quiet-hours-picker.interface.ts
 * @module @stackra/notifications/react/components/preferences
 * @description Props for the {@link QuietHoursPicker} component.
 */

import type { IQuietHoursWindow } from '@/core/interfaces';

/**
 * Props accepted by {@link QuietHoursPicker}.
 */
export interface QuietHoursPickerProps {
  /**
   * The current window, or `null` for "no quiet hours set". Passing
   * `null` renders the picker with sensible defaults but keeps the
   * "enabled" hint muted.
   */
  readonly value: IQuietHoursWindow | null;
  /** Called whenever any field changes. */
  readonly onChange: (next: IQuietHoursWindow) => void;
  /** Optional list of allowed timezones (defaults to `DEFAULT_TIMEZONES`). */
  readonly timezones?: readonly string[];
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}
