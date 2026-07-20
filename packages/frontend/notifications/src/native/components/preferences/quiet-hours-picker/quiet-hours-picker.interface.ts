/**
 * @file quiet-hours-picker.interface.ts
 * @module @stackra/notifications/native/components/preferences
 * @description Props for the native
 *   {@link QuietHoursPicker} component.
 */

import type { IQuietHoursWindow } from '@/core/interfaces';

/**
 * Props accepted by the native {@link QuietHoursPicker}.
 */
export interface QuietHoursPickerProps {
  /**
   * The current window, or `null` for "no quiet hours set". Passing
   * `null` renders the picker with sensible defaults.
   */
  readonly value: IQuietHoursWindow | null;
  /** Called whenever any field changes. */
  readonly onChange: (next: IQuietHoursWindow) => void;
  /**
   * Optional list of allowed timezones. Defaults to
   * `DEFAULT_TIMEZONES` from `@stackra/notifications/core`.
   */
  readonly timezones?: readonly string[];
  /** Additional Uniwind classes appended to the root. */
  readonly className?: string;
}
