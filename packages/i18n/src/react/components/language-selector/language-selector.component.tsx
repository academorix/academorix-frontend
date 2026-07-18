/**
 * @file language-selector.component.tsx
 * @module @stackra/i18n/react/components
 * @description Language selector built on `@stackra/ui/react`'s `ComboBox`.
 *
 *   Uses HeroUI v3's `ComboBox` compound (per the workspace rule that prefers
 *   `ComboBox` over `Select` — a text-input + listbox that scales to any
 *   locale list length without a separate search field).
 *
 *   Renders the current locale's `name` (and optional flag) as the input
 *   value. Selecting a new locale invokes `setLocale(...)` from the i18n
 *   system, which persists, applies direction, and reloads translations.
 *
 * @example
 * ```tsx
 * <LanguageSelector />
 * <LanguageSelector
 *   label="Language"
 *   locales={[
 *     { code: 'en', name: 'English', flag: '🇺🇸' },
 *     { code: 'ar', name: 'العربية', flag: '🇸🇦' },
 *   ]}
 * />
 * ```
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import type { Key } from 'react';
import { ComboBox, Input, Label, ListBox } from '@stackra/ui/react';

import { useI18n } from '@/core/hooks/use-i18n.hook';
import type { LanguageSelectorProps, LocaleItem } from '@/react/interfaces';

/**
 * Language selector — a filterable dropdown for switching the active locale.
 */
export function LanguageSelector({
  label,
  locales,
  className,
  placeholder = 'Select language',
}: LanguageSelectorProps): React.ReactElement {
  const { locale, setLocale, languages } = useI18n();

  // Fall back to supportedLocales when the consumer didn't override
  const items: LocaleItem[] = useMemo(
    () => locales ?? languages.map((code) => ({ code, name: code })),
    [locales, languages]
  );

  const handleSelectionChange = useCallback(
    (key: Key | null) => {
      if (typeof key === 'string' && key !== locale) {
        void setLocale(key);
      }
    },
    [locale, setLocale]
  );

  return (
    <ComboBox
      className={className}
      selectedKey={locale}
      onSelectionChange={handleSelectionChange}
      menuTrigger="focus"
    >
      {label ? <Label>{label}</Label> : null}
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.code} id={item.code} textValue={item.name}>
              <span className="flex items-center gap-2">
                {item.flag ? <span>{item.flag}</span> : null}
                <span>{item.name}</span>
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
