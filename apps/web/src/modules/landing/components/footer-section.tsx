/**
 * @file footer-section.tsx
 * @module modules/landing/components/footer-section
 *
 * @description
 * Site footer: brand blurb, four link columns (Product / Company / Resources /
 * Legal), and a bottom bar with the dynamic copyright. In-page and external
 * targets are plain anchors; genuine app routes (`/`, `/login`) use the
 * react-router `Link` for client-side navigation.
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { Separator } from "@academorix/ui/react";
import { Link } from "react-router";

import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { appRoutes } from "@/lib/module";

/** A single footer link. */
interface FooterLink {
  label: string;
  href: string;
  /** When true, opens in a new tab with safe `rel`. */
  external?: boolean;
}

/** A titled group of footer links. */
interface FooterColumn {
  title: string;
  links: readonly FooterLink[];
}

/** The four footer columns, in display order. */
const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Sports", href: "#sports" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#top" },
      { label: "Careers", href: "#top" },
      { label: "Contact", href: "#top" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: siteConfig.links.github, external: true },
      { label: "API status", href: siteConfig.api.baseUrl, external: true },
      { label: "Community", href: siteConfig.links.github, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#top" },
      { label: "Terms", href: "#top" },
      { label: "Security", href: "#top" },
    ],
  },
] as const;

/** Renders a single footer link, choosing anchor attributes by target type. */
function FooterLinkItem({ link }: { link: FooterLink }): ReactNode {
  return (
    <a
      className="text-sm text-muted transition-colors hover:text-foreground"
      href={link.href}
      {...(link.external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
    >
      {link.label}
    </a>
  );
}

/**
 * The landing-page footer.
 */
export function FooterSection(): ReactNode {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-default bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          {/* Brand blurb */}
          <div className="col-span-2">
            <Link
              aria-label={`${siteConfig.name} home`}
              className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
              to={appRoutes.home}
            >
              <AcademicCapIcon aria-hidden="true" className="size-6" />
              <span className="text-base font-bold text-foreground">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted">{siteConfig.description}</p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((column) => (
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
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <Link
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            to={appRoutes.login}
          >
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
