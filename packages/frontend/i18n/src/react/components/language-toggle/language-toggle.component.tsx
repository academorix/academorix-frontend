/**
 * @file language-toggle.component.tsx
 * @module @stackra/i18n/react/components
 * @description Compact language toggle built on `@stackra/ui/react`'s
 *   `ToggleButtonGroup` (single-selection). Ideal for apps with 2–3
 *   locales where a visible pill switch reads more naturally than a
 *   dropdown.
 *
 * @example
 * ```tsx
 * <LanguageToggle />
 * <LanguageToggle
 *   options={[
 *     { code: 'en', label: 'EN' },
 *     { code: 'ar', label: 'ع' },
 *   ]}
 * />
 * ```
 */

"use client";

import React, { useCallback, useMemo } from "react";
import type { Key } from "react";
import { ToggleButton, ToggleButtonGroup } from "@stackra/ui/react";

import { useI18n } from "@/core/hooks/use-i18n.hook";
import type { LanguageToggleOption, LanguageToggleProps } from "@/react/interfaces";

/**
 * Compact language toggle — pill-shaped button group for 2–3 locales.
 */
export function LanguageToggle({ options, className }: LanguageToggleProps): React.ReactElement {
  const { locale, setLocale, languages } = useI18n();

  const items: LanguageToggleOption[] = useMemo(
    () => options ?? languages.map((code) => ({ code, label: code.toUpperCase() })),
    [options, languages],
  );

  const handleSelectionChange = useCallback(
    (keys: Set<Key>) => {
      // Single-selection mode — the set holds at most one entry.
      const [next] = [...keys];
      if (typeof next === "string" && next !== locale) {
        void setLocale(next);
      }
    },
    [locale, setLocale],
  );

  return (
    <ToggleButtonGroup
      className={className}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[locale]}
      onSelectionChange={handleSelectionChange}
    >
      {items.map((item, index) => (
        <ToggleButton key={item.code} id={item.code}>
          {index > 0 ? <ToggleButtonGroup.Separator /> : null}
          {item.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
