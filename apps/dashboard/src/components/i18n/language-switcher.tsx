/**
 * @file language-switcher.tsx
 * @module components/i18n/language-switcher
 *
 * @description
 * A compact dropdown that switches the app locale. Changing the locale
 * re-translates the tree (via the Refine i18n provider) and flips the document
 * to RTL for right-to-left languages, both handled by
 * {@link "@/lib/i18n/locale-context".LocaleProvider}.
 */

import { LanguageIcon } from "@academorix/ui/icons/outline";
import { Button, Dropdown, Label } from "@academorix/ui/react";

import type { Locale } from "@/lib/i18n";
import type { Key, ReactNode } from "react";

import { LOCALE_LABELS, LOCALES, useLocale } from "@/lib/i18n";

/** Props for {@link LanguageSwitcher}. */
interface LanguageSwitcherProps {
  /** Optional extra classes for the trigger button. */
  className?: string;
}

/**
 * Switches between the supported locales, highlighting the active one.
 *
 * @param props - Optional styling overrides.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps): ReactNode {
  const { locale, setLocale } = useLocale();

  const handleAction = (key: Key): void => {
    setLocale(key as Locale);
  };

  return (
    <Dropdown>
      <Button isIconOnly aria-label="Change language" className={className} variant="ghost">
        <LanguageIcon aria-hidden="true" className="size-5" />
      </Button>

      <Dropdown.Popover className="min-w-[160px]" placement="bottom end">
        <Dropdown.Menu
          disallowEmptySelection
          selectedKeys={new Set([locale])}
          selectionMode="single"
          onAction={handleAction}
        >
          {LOCALES.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={LOCALE_LABELS[code]}>
              <Label>{LOCALE_LABELS[code]}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
