/**
 * @file footer-section.tsx
 * @module components/landing/footer-section
 *
 * @description
 * Enterprise-grade site footer: brand + tagline, four columns of navigation,
 * a hairline separator, and a bottom utility bar carrying the copyright,
 * a compact language switcher, a "Sign in" link, and the social row
 * (GitHub / X / Community) driven off `site.social.*`.
 *
 * Every column title + link label is pulled from the active locale's
 * `messages/{locale}.json` so translations ship without touching JSX.
 * The bottom bar's language switcher lets visitors flip locale from the
 * fold as well as the header, matching the pattern used by every large
 * SaaS marketing site (Vercel, Stripe, Segment, Linear, HubSpot).
 *
 * Server Component — the `LanguageSwitcher` inside is a `"use client"`
 * component and React handles the boundary automatically.
 */

import {
  ChatBubbleLeftRightIcon,
  CodeBracketSquareIcon,
  HashtagIcon,
} from "@academorix/ui/icons/outline";
import { Separator } from "@academorix/ui/react";
import { useTranslations } from "next-intl";

import type { SiteData } from "@/lib/types";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/nav/language-switcher";
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

/**
 * Small icon-only anchor used in the footer social row. External-only —
 * every href is expected to point at a third-party domain (GitHub, X,
 * community forum), so we always open in a new tab with the safe rel.
 */
function SocialIconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: (props: { className?: string; "aria-hidden"?: boolean }) => ReactNode;
}): ReactNode {
  return (
    <a
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-default/40 hover:text-foreground"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Icon aria-hidden className="size-5" />
    </a>
  );
}

/** The landing-page footer. */
export function FooterSection({ site }: FooterSectionProps): ReactNode {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const year = new Date().getFullYear();

  const columns: readonly FooterColumn[] = [
    {
      title: t("columns.product"),
      links: [
        { label: t("product.athletes"), href: "/products/athletes" },
        { label: t("product.teams"), href: "/products/teams" },
        { label: t("product.scheduling"), href: "/products/scheduling" },
        { label: t("product.payments"), href: "/products/payments" },
        { label: t("product.performance"), href: "/products/performance" },
        { label: t("product.pricing"), href: "/pricing" },
      ],
    },
    {
      title: t("columns.sports"),
      links: [
        { label: t("sports.football"), href: "/sports/football" },
        { label: t("sports.swimming"), href: "/sports/swimming" },
        { label: t("sports.basketball"), href: "/sports/basketball" },
        { label: t("sports.tennis"), href: "/sports/tennis" },
        { label: t("sports.martialArts"), href: "/sports/martial-arts" },
        { label: t("sports.gymnastics"), href: "/sports/gymnastics" },
      ],
    },
    {
      title: t("columns.resources"),
      links: [
        { label: t("resources.documentation"), href: "/docs" },
        { label: t("resources.blog"), href: "/blog" },
        { label: t("resources.changelog"), href: "/changelog" },
        { label: t("resources.customerStories"), href: "/customers" },
        { label: t("resources.newsletter"), href: "/newsletter" },
      ],
    },
    {
      title: t("columns.legal"),
      links: [
        { label: t("legal.privacy"), href: "/legal/privacy" },
        { label: t("legal.terms"), href: "/legal/terms" },
        { label: t("legal.security"), href: "/legal/security" },
        { label: t("legal.cookies"), href: "/legal/cookies" },
        { label: t("legal.dpa"), href: "/legal/dpa" },
      ],
    },
  ];

  return (
    <footer className="border-t border-default bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        {/* Brand + columns */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link
              aria-label={`${site.name}`}
              className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
              href="/"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-8 items-center justify-center rounded-md bg-accent/10 text-sm font-bold text-accent"
              >
                A
              </span>
              <span className="text-base font-semibold text-foreground">{site.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{site.description}</p>

            {/* Social row */}
            <div className="mt-6 flex items-center gap-1">
              {site.social.github ? (
                <SocialIconLink
                  href={site.social.github}
                  icon={CodeBracketSquareIcon}
                  label="GitHub"
                />
              ) : null}
              {site.social.twitter ? (
                <SocialIconLink href={site.social.twitter} icon={HashtagIcon} label="X" />
              ) : null}
              {site.social.community ? (
                <SocialIconLink
                  href={site.social.community}
                  icon={ChatBubbleLeftRightIcon}
                  label="Community"
                />
              ) : null}
            </div>
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

        {/* Bottom utility bar */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted">{t("copyright", { year, name: site.name })}</p>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher placement="top end" variant="compact" />
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-default" />
            <a
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-default/40 hover:text-foreground"
              href={`${getAppUrl()}/login`}
              rel="noreferrer"
            >
              {tCommon("signIn")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
