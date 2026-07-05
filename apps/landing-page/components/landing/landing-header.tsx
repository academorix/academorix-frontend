/**
 * @file landing-header.tsx
 * @module components/landing/landing-header
 *
 * @description
 * Sticky top navigation for the marketing surface. Client Component that
 * receives fully-hydrated `nav` + `site` data from its Server-Component
 * parent (`MarketingShell`). Renders the brand mark on the leading edge,
 * the enterprise mega-menu in the middle, and — on the trailing edge —
 * the language switcher, theme toggle, "Sign in" secondary link, and
 * the "Get started" primary CTA. Mobile falls back to the drawer nav.
 *
 * ## Enterprise-grade layout
 *
 * The trailing action row mirrors the Vercel / Linear / Stripe pattern:
 *
 *   [language]  [theme]  |  Sign in  [primary Get started]
 *
 * A hairline separator visually decouples the utility toggles (language +
 * theme) from the conversion pair (sign-in + CTA), while collapsing
 * cleanly to icons-only + hamburger below the `lg` breakpoint.
 */

"use client";

import { ArrowRightIcon, Bars3Icon, XMarkIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import type { NavData, SiteData } from "@/lib/types";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { MegaMenu } from "@/components/nav/mega-menu";
import { MobileNav } from "@/components/nav/mobile-nav";
import { ThemeSwitch } from "@/components/theme-switch";
import { Link } from "@/i18n/navigation";
import { getAppUrl } from "@/lib/env";

/** Props for {@link LandingHeader}. */
interface LandingHeaderProps {
  nav: NavData;
  site: SiteData;
}

/** The sticky landing-page header. */
export function LandingHeader({ nav, site }: LandingHeaderProps): ReactNode {
  const t = useTranslations("header");
  const common = useTranslations("common");
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  const goToLogin = useCallback((): void => {
    window.location.href = `${getAppUrl()}/login`;
  }, []);

  const goToRegister = useCallback((): void => {
    window.location.href = `${getAppUrl()}/register`;
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-default bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand → home */}
          <Link
            aria-label={t("brandAria", { name: site.name })}
            className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
            href="/"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-8 items-center justify-center rounded-md bg-accent/10 text-sm font-bold text-accent"
            >
              A
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              {site.name}
            </span>
          </Link>

          {/* Desktop mega menu */}
          <nav aria-label={t("primaryNavAria")} className="hidden items-center gap-0.5 lg:flex">
            {nav.map((entry) => {
              if (entry.kind === "link") {
                return (
                  <Link
                    key={entry.label}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-default/40 hover:text-foreground"
                    href={entry.href}
                  >
                    {entry.label}
                  </Link>
                );
              }

              return <MegaMenu key={entry.label} label={entry.label} panel={entry.panel} />;
            })}
          </nav>

          {/* Trailing action row */}
          <div className="flex items-center gap-1">
            {/* Utility toggles */}
            <div className="hidden items-center gap-0.5 sm:flex">
              <LanguageSwitcher />
              <ThemeSwitch />
            </div>

            {/* Divider — invisible on mobile where actions collapse */}
            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-default lg:inline-block" />

            {/* Conversion pair */}
            <button
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-default/40 hover:text-foreground lg:inline-flex"
              type="button"
              onClick={goToLogin}
            >
              {t("signInCta")}
            </button>

            <Button
              className="hidden rounded-full lg:inline-flex"
              variant="primary"
              onPress={goToRegister}
            >
              {common("getStarted")}
              <ArrowRightIcon aria-hidden="true" className="ms-1 size-4 rtl:rotate-180" />
            </Button>

            {/* Mobile hamburger */}
            <Button
              isIconOnly
              aria-controls="landing-mobile-nav"
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? t("closeMenu") : t("openMenu")}
              className="lg:hidden"
              variant="tertiary"
              onPress={() => setMobileNavOpen((open) => !open)}
            >
              {isMobileNavOpen ? (
                <XMarkIcon aria-hidden="true" className="size-5" />
              ) : (
                <Bars3Icon aria-hidden="true" className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <MobileNav
        isOpen={isMobileNavOpen}
        nav={nav}
        onClose={() => setMobileNavOpen(false)}
        onSignIn={goToLogin}
      />
    </>
  );
}
