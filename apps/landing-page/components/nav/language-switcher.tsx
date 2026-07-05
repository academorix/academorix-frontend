/**
 * @file language-switcher.tsx
 * @module components/nav/language-switcher
 *
 * @description
 * Enterprise-grade locale switcher for the marketing chrome. Renders a
 * HeroUI Dropdown that flips the active locale on selection; `next-intl`
 * handles the URL rewrite (English is bare, non-default locales get
 * `/{code}/*` per {@link "@/i18n/routing".routing.localePrefix}) and
 * persists the choice in the `NEXT_LOCALE` cookie for one year so
 * repeat visits land on the last-picked language.
 *
 * ## Variants
 *
 *  - `"icon"` (default) — a compact icon-only trigger. Use inside the
 *    top nav where horizontal space is precious and the neighbouring
 *    theme toggle already carries an icon.
 *  - `"compact"` — a text trigger showing the current locale label plus
 *    a chevron. Use inside the footer bottom bar where an icon-only
 *    control reads as too subtle.
 *
 * The dropdown lists every locale in its native script (English shows
 * "English", Arabic shows "العربية") — deliberate: users find their
 * language faster when it's rendered in its own writing system.
 *
 * Every navigation is a `router.replace()` so the switch doesn't push a
 * new history entry — the user's back button still returns them to the
 * page they came from, just in the previous language.
 */

"use client";

import { ChevronDownIcon, LanguageIcon } from "@academorix/ui/icons/outline";
import { Dropdown, Label } from "@academorix/ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import type { Locale } from "@/i18n/routing";
import type { Key, ReactNode } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, LOCALES } from "@/i18n/routing";

/** Visual variant of {@link LanguageSwitcher}. */
export type LanguageSwitcherVariant = "icon" | "compact";

/** Props for {@link LanguageSwitcher}. */
export interface LanguageSwitcherProps {
  /**
   * Which trigger to render. `"icon"` is the header default (globe icon
   * only); `"compact"` renders a text trigger fit for the footer.
   */
  variant?: LanguageSwitcherVariant;
  /** Extra classes on the trigger. */
  className?: string;
  /** Popover placement (Dropdown default is `bottom start`). */
  placement?: "bottom start" | "bottom end" | "top start" | "top end";
}

/**
 * Marketing-app locale switcher. Client Component — reads the current
 * locale from `next-intl` and rewrites the URL through the typed
 * navigation wrappers so the locale prefix is preserved / added / removed
 * per `routing.localePrefix`.
 */
export function LanguageSwitcher({
  variant = "icon",
  className,
  placement = "bottom end",
}: LanguageSwitcherProps): ReactNode {
  const t = useTranslations("header");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleAction = (key: Key): void => {
    const next = key as Locale;

    if (next === locale) {
      return;
    }

    startTransition(() => {
      // `router.replace` on the current path with a new locale flips the
      // URL prefix without pushing a new history entry — the back button
      // still returns the visitor to their previous non-locale-changing
      // location. next-intl updates the NEXT_LOCALE cookie automatically.
      router.replace(pathname, { locale: next });
    });
  };

  const currentLabel = LOCALE_LABELS[locale];

  return (
    <Dropdown>
      {variant === "icon" ? (
        <button
          aria-label={t("chooseLanguage")}
          className={[
            "inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors",
            "hover:bg-default/40 hover:text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            isPending ? "opacity-60" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          type="button"
        >
          <LanguageIcon aria-hidden="true" className="size-5" />
        </button>
      ) : (
        <button
          aria-label={t("chooseLanguage")}
          className={[
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors",
            "hover:bg-default/40 hover:text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            isPending ? "opacity-60" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          type="button"
        >
          <LanguageIcon aria-hidden="true" className="size-4" />
          <span>{currentLabel}</span>
          <ChevronDownIcon aria-hidden="true" className="size-3.5 opacity-70" />
        </button>
      )}

      <Dropdown.Popover className="min-w-[160px]" placement={placement}>
        <Dropdown.Menu
          disallowEmptySelection
          aria-label={t("languageLabel")}
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
