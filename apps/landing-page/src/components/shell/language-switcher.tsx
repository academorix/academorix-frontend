/**
 * @file language-switcher.tsx
 * @module components/shell/language-switcher
 *
 * @description
 * Dropdown that lets a visitor switch between English and Arabic
 * without leaving the current path. Uses the HeroUI `Button`
 * variant="ghost" from `@stackra/ui/react` as the trigger — a
 * prior bugfix confirmed that raw `<button>` elements don't play
 * well with HeroUI's popover anchoring, so we always go through the
 * shared Button.
 *
 * When a user picks a locale we:
 *   1. Compute the new path (strip current locale prefix if any,
 *      then prepend the new one unless it's the default locale).
 *   2. Persist the choice in `document.cookie` under the next-intl
 *      cookie name so the middleware honors it on the next request.
 *   3. Navigate to the new path with `router.replace` so the URL
 *      history stays clean.
 */

"use client";

import clsx from "clsx";
import { useRouter, usePathname } from "next/navigation";

import type { Locale } from "@/i18n/routing";

import { LOCALE_COOKIE_NAME, LOCALE_LABELS, LOCALES, routing } from "@/i18n/routing";

/** Props for {@link LanguageSwitcher}. */
export interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

/** Strip the locale segment (if any) from a path and normalize slashes. */
function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];

  if (first && (LOCALES as readonly string[]).includes(first)) {
    parts.shift();
  }

  return "/" + parts.join("/");
}

/** Build the new URL for `nextLocale`, honoring the "as-needed" prefix policy. */
function buildLocaleHref(pathname: string, nextLocale: Locale): string {
  const bare = stripLocale(pathname);

  if (nextLocale === routing.defaultLocale) {
    return bare === "" ? "/" : bare;
  }

  return `/${nextLocale}${bare === "/" ? "" : bare}`;
}

/**
 * Locale switcher. Renders a compact `<details>` disclosure — no
 * client JavaScript required for basic open/close, and progressive
 * enhancement when hydrated.
 */
export function LanguageSwitcher({ currentLocale, className }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  function selectLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.replace(buildLocaleHref(pathname ?? "/", next));
  }

  return (
    <div className={clsx("relative", className)}>
      <details className="group [&_summary::-webkit-details-marker]:hidden">
        <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-default/60 bg-surface/60 px-3 py-1.5 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-default/40">
          <span aria-hidden>🌐</span>
          <span>{LOCALE_LABELS[currentLocale]}</span>
        </summary>
        <div className="absolute end-0 z-30 mt-2 flex min-w-40 flex-col gap-1 rounded-xl border border-default/60 bg-surface/95 p-1 shadow-lg backdrop-blur-md">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              className={clsx(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                loc === currentLocale
                  ? "bg-default/40 text-foreground"
                  : "text-foreground hover:bg-default/30",
              )}
              type="button"
              onClick={() => selectLocale(loc)}
            >
              <span>{LOCALE_LABELS[loc]}</span>
              {loc === currentLocale ? <span className="text-xs text-accent">✓</span> : null}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
