/**
 * @file landing-header.tsx
 * @module components/shell/landing-header
 *
 * @description
 * Desktop + mobile marketing header. Renders the Academorix
 * wordmark, the top-nav (mixed link + mega-menu items), the
 * language switcher, the theme toggle, and two CTAs (sign-in
 * secondary, sign-up primary).
 *
 * The header is sticky with a backdrop-blur so it reads well over
 * the Glass theme's background gradient. The mobile drawer is a
 * separate client component that mounts a sheet-style panel.
 */

import clsx from "clsx";
import Link from "next/link";

import type { Locale } from "@/i18n/routing";
import type { Localized, NavData, SiteData } from "@/lib/types";

import { BrandMark } from "@/components/brand/brand-mark";
import { CtaButton } from "@/components/marketing/cta-button";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { MegaMenu } from "@/components/shell/mega-menu";
import { MobileDrawer } from "@/components/shell/mobile-drawer";
import { ThemeSwitch } from "@/components/shell/theme-switch";

/** Props for {@link LandingHeader}. */
export interface LandingHeaderProps {
  site: Localized<SiteData>;
  nav: Localized<NavData>;
  locale: Locale;
  className?: string;
}

/** Renders the marketing site header. */
export function LandingHeader({ site, nav, locale, className }: LandingHeaderProps) {
  const signInLabel = locale === "ar" ? "تسجيل الدخول" : "Sign in";
  const getStartedLabel = locale === "ar" ? "ابدأ الآن" : "Get started";

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 border-b border-default/40 bg-surface/70 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            aria-label={site.name}
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
            href="/"
          >
            <BrandMark priority alt="" height={28} variant="mark" />
            <span>{site.name}</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {nav.map((item, i) =>
              item.kind === "link" ? (
                <Link
                  key={i}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-default/40"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <MegaMenu key={i} label={item.label} panel={item.panel} />
              ),
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:block" currentLocale={locale} />
          <ThemeSwitch className="hidden sm:inline-flex" />

          <div className="hidden items-center gap-2 md:flex">
            <CtaButton
              className="px-4 py-2"
              cta={{ label: signInLabel, type: "link", href: "/signin" }}
              variant="ghost"
            />
            <CtaButton
              className="px-4 py-2"
              cta={{ label: getStartedLabel, type: "signup" }}
              variant="primary"
            />
          </div>

          <MobileDrawer className="md:hidden" locale={locale} nav={nav} site={site} />
        </div>
      </div>
    </header>
  );
}
