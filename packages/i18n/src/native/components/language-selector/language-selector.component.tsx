/**
 * @file language-selector.component.tsx
 * @module @stackra/i18n/native/components
 * @description Native language selector built on HeroUI Native's `Select`
 *   compound via `@stackra/ui/native` (per the workspace ui-components
 *   rule — every native visual routes through `@stackra/ui/native`).
 *
 *   The file lives under `/native` and is only loaded on React Native
 *   targets; static imports are safe because `heroui-native` and
 *   `react-native` are always resolvable on the target platform.
 */

'use client';

import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { View } from 'react-native';
import { Select, Text } from '@stackra/ui/native';

import { useI18n } from '@/react/hooks';
import type { NativeLanguageSelectorProps, NativeLocaleItem } from '@/native/interfaces';

/**
 * Shape HeroUI Native's `Select` uses for its controlled `value` /
 * `onValueChange`. Declared locally because HeroUI Native does not
 * (yet) publicly export the type.
 */
interface ISelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Native language selector — HeroUI Native `Select` (bottom-sheet by default).
 *
 * @example
 * ```tsx
 * <NativeLanguageSelector label="Language" />
 * ```
 */
export function NativeLanguageSelector({
  label = 'Language',
  locales,
  className,
}: NativeLanguageSelectorProps): ReactElement {
  const { locale, setLocale, languages } = useI18n();

  const items: NativeLocaleItem[] =
    locales ?? languages.map((code: string) => ({ code, name: code }));

  const activeOption: ISelectOption | undefined = (() => {
    const match = items.find((it) => it.code === locale);
    return match ? { value: match.code, label: match.name } : undefined;
  })();

  const onValueChange = useCallback(
    (next: ISelectOption | undefined) => {
      // HeroUI Native passes a single option (or `undefined` on deselect)
      // to `onValueChange` in single-select mode.
      if (!next) return;
      const value = next.value;
      if (value && value !== locale) void setLocale(value);
    },
    [locale, setLocale]
  );

  return (
    <View className={className}>
      <Select value={activeOption} onValueChange={onValueChange}>
        <Select.Trigger>
          <Select.Value placeholder={label} />
          <Select.TriggerIndicator />
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="bottom-sheet">
            <Select.ListLabel>{label}</Select.ListLabel>
            {items.map((item) => (
              <Select.Item key={item.code} value={item.code} label={item.name}>
                <View className="flex-1 flex-row items-center">
                  {item.flag ? <Text className="mr-2">{item.flag}</Text> : null}
                  <Select.ItemLabel />
                </View>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
