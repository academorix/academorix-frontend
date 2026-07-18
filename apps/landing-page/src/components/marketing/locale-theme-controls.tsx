import { Button, Dropdown, Label, useTheme } from "@heroui/react";

import { Iconify } from "../../icons/iconify";
import { locales, localeMeta, useI18n } from "../../i18n";
import type { Locale } from "../../i18n";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme("glass-light");
  const { t } = useI18n();
  const isDark = resolvedTheme === "glass-dark";

  return (
    <Button
      aria-label={isDark ? t("controls.light") : t("controls.dark")}
      isIconOnly
      onPress={() => setTheme(isDark ? "glass-light" : "glass-dark")}
      size="sm"
      variant="ghost"
    >
      <Iconify className="size-4" icon={isDark ? "sun" : "moon"} />
    </Button>
  );
}

function LanguageMenu() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Dropdown>
      <Button aria-label={t("controls.language")} size="sm" variant="ghost">
        <Iconify className="size-4" icon="globe" />
        <span className="text-xs font-semibold uppercase">{locale}</span>
        <Iconify className="size-3.5" icon="chevron-down" />
      </Button>
      <Dropdown.Popover className="min-w-44">
        <Dropdown.Menu
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];

            if (next) setLocale(next as Locale);
          }}
          selectedKeys={new Set([locale])}
          selectionMode="single"
        >
          {locales.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={localeMeta[code].label}>
              <span className="flex items-center gap-2.5">
                <Iconify className="size-4 rounded-[3px]" icon={localeMeta[code].flag} />
                <Label className="cursor-[inherit]">{localeMeta[code].native}</Label>
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function LocaleThemeControls() {
  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <LanguageMenu />
    </div>
  );
}
