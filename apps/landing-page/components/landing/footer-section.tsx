/**
 * @file footer-section.tsx
 * @module components/landing/footer-section
 *
 * @description
 * Site footer: brand blurb + 4-column link matrix + copyright. Server
 * Component that receives fully-hydrated `site` data from the marketing
 * shell — every string comes from `public/data/site.json`.
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { Separator } from "@academorix/ui/react";

import type { SiteData } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { getAppUrl } from "@/lib/env";
import { isExternalHref } from "@/lib/marketing/cta";

/** Props for {@link FooterSection}. */
interface FooterSectionProps {
  site: SiteData;
}

/** A single link inside a footer column. */
interface FooterLink {
  label: string;
  href: string;
}

/** A titled column of footer links. */
interface FooterColumn {
  title: string;
  links: readonly FooterLink[];
}

/** Renders a single footer link, choosing anchor attributes by target type. */
function FooterLinkItem({ link }: { link: FooterLink }): ReactNode {
  const className = "text-sm text-muted transition-colors hover:text-foreground";

  if (isExternalHref(link.href)) {
    return (
      <a className={className} href={link.href} rel="noopener noreferrer" target="_blank">
        {link.label}
      </a>
    );
  }

  return (
    <Link className={className} href={link.href}>
      {link.label}
    </Link>
  );
}

/** The landing-page footer. */
export function FooterSection({ site }: FooterSectionProps): ReactNode {
  const year = new Date().getFullYear();

  const columns: readonly FooterColumn[] = [
    {
      title: "Product",
      links: [
        { label: "Athletes", href: "/products/athletes" },
        { label: "Teams", href: "/products/teams" },
        { label: "Scheduling", href: "/products/scheduling" },
        { label: "Payments", href: "/products/payments" },
        { label: "Performance", href: "/products/performance" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Sports",
      links: [
        { label: "Football", href: "/sports/football" },
        { label: "Swimming", href: "/sports/swimming" },
        { label: "Basketball", href: "/sports/basketball" },
        { label: "Tennis", href: "/sports/tennis" },
        { label: "Martial Arts", href: "/sports/martial-arts" },
        { label: "Gymnastics", href: "/sports/gymnastics" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "Blog", href: "/blog" },
        { label: "Changelog", href: "/changelog" },
        { label: "Customer stories", href: "/customers" },
        { label: "Newsletter", href: "/newsletter" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/legal/privacy" },
        { label: "Terms", href: "/legal/terms" },
        { label: "Security", href: "/legal/security" },
        { label: "Cookies", href: "/legal/cookies" },
        { label: "DPA", href: "/legal/dpa" },
      ],
    },
  ];

  return (
    <footer className="border-t border-default bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link
              aria-label={`${site.name} home`}
              className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
              href="/"
            >
              <AcademicCapIcon aria-hidden="true" className="size-6" />
              <span className="text-base font-bold text-foreground">{site.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted">{site.description}</p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted">
            © {year} {site.name}. All rights reserved.
          </p>
          <a
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            href={`${getAppUrl()}/login`}
            rel="noreferrer"
          >
            Sign in
          </a>
        </div>
      </div>
    </footer>
  );
}
