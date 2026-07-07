/**
 * @file mobile-drawer.tsx
 * @module components/shell/mobile-drawer
 *
 * @description
 * Sheet-style mobile navigation. Trigger is a hamburger; content is
 * a full-height overlay listing every nav entry, the language
 * switcher, the theme toggle, and CTAs. Uses a controlled `open`
 * state driven by React so it stays composable inside RSC-rendered
 * shells (the trigger sits at the client boundary, the header stays
 * server-only).
 */

"use client";

import Link from "next/link";
import { useState } from "react";

import type { Locale } from "@/i18n/routing";
import type { Localized, NavData, SiteData } from "@/lib/types";

import { BrandLink } from "@/components/brand/brand-link";
import { BrandMark } from "@/components/brand/brand-mark";
import { CtaButton } from "@/components/marketing/cta-button";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { ThemeSwitch } from "@/components/shell/theme-switch";

/** Props for {@link MobileDrawer}. */
export interface MobileDrawerProps {
  site: Localized<SiteData>;
  nav: Localized<NavData>;
  locale: Locale;
  className?: string;
}

/** Renders the mobile drawer trigger + overlay. */
export function MobileDrawer({ site, nav, locale, className }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open menu"
        className={`inline-flex size-9 items-center justify-center rounded-full border border-default/60 bg-surface/60 text-foreground backdrop-blur-sm ${className ?? ""}`}
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden>≡</span>
      </button>

      {open ? (
        <div
          aria-label="Close menu"
          className="fixed inset-0 z-50 flex justify-end bg-backdrop/60 backdrop-blur-sm"
          role="button"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div
            className="flex h-full w-full max-w-sm flex-col gap-6 bg-surface/95 p-6 shadow-2xl backdrop-blur-md"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <BrandLink
                aria-label={site.name}
                className="inline-flex items-center gap-2 text-lg font-semibold text-foreground"
                onClick={() => setOpen(false)}
              >
                <BrandMark alt="" height={28} variant="mark" />
                <span>{site.name}</span>
              </BrandLink>
              <button
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-full border border-default/60 bg-surface/60 text-foreground"
                type="button"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <nav aria-label="Primary mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {nav.map((item, i) => (
                <details key={i} className="[&_summary::-webkit-details-marker]:hidden">
                  {item.kind === "link" ? (
                    <Link
                      className="block rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-default/40"
                      href={item.href}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <summary className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-default/40">
                        <span>{item.label}</span>
                        <span aria-hidden>▾</span>
                      </summary>
                      <div className="flex flex-col gap-1 ps-4 pt-1">
                        {item.panel.feature_cards?.map((card, ci) => (
                          <Link
                            key={ci}
                            className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-default/40 hover:text-foreground"
                            href={card.href}
                            onClick={() => setOpen(false)}
                          >
                            {card.title}
                          </Link>
                        ))}
                        {item.panel.columns?.flatMap((col) =>
                          col.links.map((link, li) => (
                            <Link
                              key={`${col.title}-${li}`}
                              className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-default/40 hover:text-foreground"
                              href={link.href}
                              onClick={() => setOpen(false)}
                            >
                              {link.label}
                            </Link>
                          )),
                        )}
                      </div>
                    </>
                  )}
                </details>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-2 border-t border-default/40 pt-4">
              <LanguageSwitcher currentLocale={locale} />
              <ThemeSwitch />
            </div>

            <div className="flex flex-col gap-2">
              <CtaButton cta={{ label: "Sign in", type: "signin" }} variant="ghost" />
              <CtaButton cta={{ label: "Get started", type: "signup" }} variant="primary" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
