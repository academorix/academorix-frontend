/**
 * @file landing-header.tsx
 * @module modules/landing/components/landing-header
 *
 * @description
 * Sticky top navigation for the public landing page. Carries the brand mark,
 * the in-page anchor navigation (Features / Sports / Pricing), a theme toggle,
 * and the primary "Sign in" call-to-action that routes to `/login`.
 *
 * On small screens the anchor navigation collapses behind an accessible
 * disclosure toggle (`aria-expanded` / `aria-controls`) so the header stays
 * usable on mobile without a heavyweight drawer. Selecting any link closes the
 * panel again.
 */

import { AcademicCapIcon, Bars3Icon, XMarkIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import type { ReactNode } from "react";

import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { siteConfig } from "@/config/site";
import { appRoutes } from "@/lib/module";

/** A single in-page anchor entry rendered in the header navigation. */
interface NavItem {
  /** Visible label. */
  label: string;
  /** Same-page fragment target (matches a section `id`). */
  href: string;
}

/** The header's in-page anchor targets, in display order. */
const NAV_ITEMS: readonly NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Sports", href: "#sports" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
] as const;

/**
 * The sticky landing-page header.
 *
 * Renders the brand, primary navigation, theme switch, and the sign-in CTA,
 * with a collapsible menu on mobile.
 */
export function LandingHeader(): ReactNode {
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const goToLogin = (): void => {
    navigate(appRoutes.login);
  };

  const closeMenu = (): void => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-default bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand → home */}
        <Link
          aria-label={`${siteConfig.name} home`}
          className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
          to={appRoutes.home}
        >
          <AcademicCapIcon aria-hidden="true" className="size-7" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-default/40 hover:text-foreground"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          {/* Primary CTA — shown alongside the desktop nav (mobile uses the menu) */}
          <Button className="hidden md:inline-flex" variant="primary" onPress={goToLogin}>
            Sign in
          </Button>

          {/* Mobile disclosure toggle */}
          <Button
            isIconOnly
            aria-controls="landing-mobile-nav"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden"
            variant="ghost"
            onPress={() => setMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <XMarkIcon aria-hidden="true" className="size-5" />
            ) : (
              <Bars3Icon aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {isMenuOpen ? (
        <nav
          aria-label="Mobile"
          className="border-t border-default bg-background px-4 py-3 md:hidden"
          id="landing-mobile-nav"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-default/40 hover:text-foreground"
                  href={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Button
                className="w-full"
                variant="primary"
                onPress={() => {
                  closeMenu();
                  goToLogin();
                }}
              >
                Sign in
              </Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
