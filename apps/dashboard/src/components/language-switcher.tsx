/**
 * @file language-switcher.tsx
 * @module components/language-switcher
 *
 * @description
 * Language dropdown that shows the active locale's flag + native-script name
 * on its trigger, and every enabled locale with a flag + native label in the
 * menu. Native-script labels stay readable regardless of the current UI
 * language.
 */

import { Button, Dropdown, Label } from "@heroui/react";

import type { Locale } from "@/i18n/config";
import type { Key, ReactNode } from "react";

import { LOCALE_FLAGS, LOCALE_LABELS, LOCALES } from "@/i18n/config";
import { Iconify } from "@/icons/iconify";
import { useLocale } from "@/hooks/use-locale";
import { useTranslate } from "@/hooks/use-translate";

export type LanguageSwitcherProps = {
  className?: string;
  /** Compact trigger — flag + short code only. Defaults to `false` (full label). */
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps): ReactNode {
  const { locale, setLocale } = useLocale();
  const t = useTranslate();

  const handleAction = (key: Key) => {
    setLocale(String(key) as Locale);
  };

  return (
    <Dropdown>
      <Button
        aria-label={t("app.language", undefined, "Language")}
        className={className}
        size="sm"
        variant="ghost"
      >
        <Iconify
          aria-hidden
          className="size-4 shrink-0 self-center rounded-[3px]"
          icon={LOCALE_FLAGS[locale]}
        />
        <span className={"self-center truncate text-sm " + (compact ? "uppercase" : "")}>
          {compact ? locale : LOCALE_LABELS[locale]}
        </span>
        <Iconify className="size-3.5 shrink-0 self-center text-muted" icon="chevron-down" />
      </Button>
      <Dropdown.Popover className="min-w-52" placement="bottom end">
        <Dropdown.Menu
          disallowEmptySelection
          onAction={handleAction}
          selectedKeys={new Set([locale])}
          selectionMode="single"
        >
          {LOCALES.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={LOCALE_LABELS[code]}>
              <Iconify
                aria-hidden
                className="size-4 shrink-0 rounded-[3px]"
                icon={LOCALE_FLAGS[code]}
              />
              <Label className="flex flex-col items-start gap-0 leading-tight">
                <span>{LOCALE_LABELS[code]}</span>
                <span className="text-[10px] tracking-wide text-muted uppercase">{code}</span>
              </Label>
              {code === locale ? (
                <Iconify className="ms-auto size-4 text-accent" icon="check" />
              ) : null}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
