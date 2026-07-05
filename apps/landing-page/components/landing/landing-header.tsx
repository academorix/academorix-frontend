/**
 * @file landing-header.tsx
 * @module components/landing/landing-header
 *
 * @description
 * Sticky top navigation for the marketing surface. Client Component that
 * receives fully-hydrated `nav` + `site` data from its Server-Component
 * parent (`MarketingShell`). Renders the brand mark, the enterprise
 * mega-menu, the theme toggle, and the primary "Sign in" CTA that opens
 * the tenant SPA.
 */

"use client";

import { AcademicCapIcon, Bars3Icon, XMarkIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useCallback, useState } from "react";

import type { NavData, SiteData } from "@/lib/types";
import type { ReactNode } from "react";

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
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  const goToLogin = useCallback((): void => {
    window.location.href = `${getAppUrl()}/login`;
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-default bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand → home */}
          <Link
            aria-label={`${site.name} home`}
            className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
            href="/"
          >
            <AcademicCapIcon aria-hidden="true" className="size-7" />
            <span className="text-lg font-bold tracking-tight text-foreground">{site.name}</span>
          </Link>

          {/* Desktop mega menu */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
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

          <div className="flex items-center gap-2">
            <ThemeSwitch />

            <Button
              className="hidden rounded-full lg:inline-flex"
              variant="primary"
              onPress={goToLogin}
            >
              Sign in
            </Button>

            <Button
              isIconOnly
              aria-controls="landing-mobile-nav"
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
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
