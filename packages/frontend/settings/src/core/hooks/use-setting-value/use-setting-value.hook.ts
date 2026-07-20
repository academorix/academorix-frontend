/**
 * @file use-setting-value.hook.ts
 * @module @stackra/settings/core/hooks
 * @description Reactive single-field settings hook.
 *
 *   Sugar over `useSettings` for the common case where a component
 *   only needs one field's value + setter. Same subscription plumbing.
 */

import { useCallback } from 'react';
import type { Type } from '@stackra/contracts';

import { useSettings } from '../use-settings';
import type { IUseSettingValueResult } from './use-setting-value.interface';

/**
 * Subscribe to a single field on a settings group.
 *
 * @example DTO form
 * ```tsx
 * const { value, setValue } = useSettingValue(DisplaySettings, 'compact');
 * <Switch isSelected={value} onChange={setValue} />
 * ```
 *
 * @example Key form
 * ```tsx
 * const { value, setValue } = useSettingValue<boolean>('display', 'compact');
 * ```
 */
export function useSettingValue<T extends object, K extends keyof T & string>(
  dto: Type<T>,
  key: K
): IUseSettingValueResult<T[K]>;
export function useSettingValue<TValue = unknown>(
  groupKey: string,
  fieldKey: string
): IUseSettingValueResult<TValue>;
export function useSettingValue<T extends object>(
  dtoOrKey: Type<T> | string,
  fieldKey: string
): IUseSettingValueResult<unknown> {
  // Overload resolution splits over the runtime `typeof` — both paths
  // route through the same `useSettings` under the hood so the
  // subscription plumbing is shared.
  const result =
    typeof dtoOrKey === 'string'
      ? useSettings<Record<string, unknown>>(dtoOrKey)
      : useSettings(dtoOrKey);

  const setValue = useCallback(
    (next: unknown): void => {
      result.set(fieldKey as keyof T & string, next);
    },
    [result, fieldKey]
  );

  return {
    value: (result.values as Record<string, unknown>)[fieldKey],
    setValue,
  };
}
