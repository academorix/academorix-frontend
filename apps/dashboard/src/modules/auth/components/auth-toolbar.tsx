/**
 * @file auth-toolbar.tsx
 * @module modules/auth/components/auth-toolbar
 *
 * @description
 * Top-right chrome for the auth surface — language + theme switchers.
 * Rendered as a floating bar so it doesn't compete with the form
 * hierarchy, but stays within reach of the caller's eye.
 *
 * ## Composition
 *
 * Both controls are HeroUI Pro compound components (Dropdown for
 * language, Button for theme). Locale + theme setters resolve
 * through the existing `useLocale()` + `useTheme()` hooks so a
 * change here immediately propagates to the whole app.
 */

import { Button, Dropdown, Label } from "@heroui/react";

import type { ReactNode } from "react";

import type { Locale } from "@/i18n/config";

import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from "@/i18n/config";
import { Iconify } from "@/icons/iconify";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";

/**
 * Compact toolbar with a language dropdown + theme cycle button.
 * Rendered inside {@link AuthShell} above the form column.
 */
export function AuthToolbar(): ReactNode {
  const { locale, setLocale } = useLocale();
  const { mode, setMode } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      <Dropdown>
        <Button
          aria-label="Language"
          className="gap-1.5 rounded-full text-muted hover:text-foreground"
          size="sm"
          variant="ghost"
        >
          <Iconify className="size-4" icon={LOCALE_FLAGS[locale]} />
          <span className="text-xs font-medium">{LOCALE_LABELS[locale]}</span>
          <Iconify className="size-3 opacity-70" icon="chevron-down" />
        </Button>
        <Dropdown.Popover className="min-w-40" placement="bottom end">
          <Dropdown.Menu
            onAction={(key) => setLocale(key as Locale)}
            selectedKeys={new Set([locale])}
            selectionMode="single"
          >
            {LOCALES.map((entry) => (
              <Dropdown.Item key={entry} id={entry} textValue={LOCALE_LABELS[entry]}>
                <Iconify className="size-4 shrink-0" icon={LOCALE_FLAGS[entry]} />
                <Label>{LOCALE_LABELS[entry]}</Label>
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <Dropdown>
        <Button
          aria-label="Theme"
          className="rounded-full text-muted hover:text-foreground"
          isIconOnly
          size="sm"
          variant="ghost"
        >
          <Iconify
            className="size-4"
            icon={mode === "dark" ? "moon" : mode === "system" ? "circle-half" : "sun"}
          />
        </Button>
        <Dropdown.Popover className="min-w-40" placement="bottom end">
          <Dropdown.Menu
            onAction={(key) => setMode(key as "light" | "dark" | "system")}
            selectedKeys={new Set([mode])}
            selectionMode="single"
          >
            <Dropdown.Item id="light" textValue="Light">
              <Iconify className="size-4 shrink-0" icon="sun" />
              <Label>Light</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
            <Dropdown.Item id="dark" textValue="Dark">
              <Iconify className="size-4 shrink-0" icon="moon" />
              <Label>Dark</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
            <Dropdown.Item id="system" textValue="System">
              <Iconify className="size-4 shrink-0" icon="circle-half" />
              <Label>System</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
