/**
 * @file footer-section.tsx
 * @module components/landing/footer-section
 *
 * @description
 * Enterprise mega-footer for the marketing surface — modelled on the
 * two-row Vercel / Stripe / Linear pattern. Twelve navigation columns
 * (six product-facing, six company + resources + legal), a utility bar
 * carrying the brand mark + tagline + copyright on the leading edge and
 * the status pill / language switcher / theme toggle / region selector
 * on the trailing edge.
 *
 * ## What lives where
 *
 *  - **Row 1 (product-facing)**: Products, Sports, Solutions, Enterprise,
 *    Personas, Regions. This is the "what can I buy?" surface.
 *  - **Row 2 (company + resources + legal)**: Build, Learn, Explore,
 *    Company, Legal & Trust, Social. This is the "who are you?" surface.
 *  - **Utility bar**: brand + tagline + copyright on the left; status,
 *    language, theme, region on the right.
 *
 * Every visible string flows through `useTranslations("footer")` so
 * English and Arabic are both first-class. Locale-aware links use the
 * typed `Link` from `@/i18n/navigation`; anything external (docs, status,
 * changelog, YouTube, social handles) uses a raw `<a>` with the safe rel.
 *
 * ## Server Component
 *
 * The wrapper renders on the server — cheap, no JS runs for the columns
 * themselves. Interactive parts (`LanguageSwitcher`, `ThemeSwitch`,
 * `RegionSelector`) are Client Components; React handles the boundary.
 */

import { Chip, Separator } from "@academorix/ui/react";
import { useTranslations } from "next-intl";

import type { SiteData } from "@/lib/types";
import type { ReactNode } from "react";

import { RegionSelector } from "@/components/footer/region-selector";
import { StatusIndicator } from "@/components/footer/status-indicator";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { ThemeSwitch } from "@/components/theme-switch";
import { Link } from "@/i18n/navigation";
import { getChangelogUrl, getDocsUrl, getStatusUrl, getTutorialsUrl } from "@/lib/env";
import { isExternalHref } from "@/lib/marketing/cta";

/** Props for {@link FooterSection}. */
interface FooterSectionProps {
  site: SiteData;
}

/** A single link inside a footer column. */
interface FooterLink {
  label: string;
  href: string;
  /** Optional inline badge (e.g. "Coming soon" for unreleased sports). */
  badge?: string;
}

/** A titled column of footer links. */
interface FooterColumn {
  /** Stable React key — independent of the translated title. */
  key: string;
  title: string;
  links: readonly FooterLink[];
}

/**
 * Renders a single footer link. Chooses the right anchor primitive based
 * on the href — internal paths use the locale-aware `Link`, everything
 * external goes through a raw `<a>` with the safe rel + target.
 *
 * When a badge is present, we render a small HeroUI `Chip` right after
 * the label so the "Coming soon" callout stays inline with the row.
 */
function FooterLinkItem({ link }: { link: FooterLink }): ReactNode {
  const className =
    "inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded";

  const body = (
    <>
      <span>{link.label}</span>
      {link.badge ? (
        <Chip color="warning" size="sm" variant="soft">
          <Chip.Label>{link.badge}</Chip.Label>
        </Chip>
      ) : null}
    </>
  );

  if (isExternalHref(link.href)) {
    return (
      <a className={className} href={link.href} rel="noopener noreferrer" target="_blank">
        {body}
      </a>
    );
  }

  return (
    <Link className={className} href={link.href}>
      {body}
    </Link>
  );
}

/**
 * Renders a titled column of links. Heading is a level-2 heading — the
 * footer sits at the bottom of the page and every column represents a
 * distinct section, so h2 is the correct semantic level.
 */
function ColumnBlock({ column }: { column: FooterColumn }): ReactNode {
  return (
    <nav aria-label={column.title} className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
        {column.title}
      </h2>
      <ul className="flex flex-col gap-3">
        {column.links.map((link) => (
          <li key={`${column.key}-${link.label}`}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The landing-page mega-footer. */
export function FooterSection({ site }: FooterSectionProps): ReactNode {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  // Resolve external endpoints once up-front so the JSX stays flat.
  const docsUrl = getDocsUrl();
  const changelogUrl = getChangelogUrl();
  const statusUrl = getStatusUrl();
  const tutorialsUrl = getTutorialsUrl();

  // LinkedIn falls back to the community URL until we ship a real
  // LinkedIn company page — the brief calls this a placeholder.
  const linkedinHref = site.social.linkedin ?? site.social.community;

  // ─────────────────────────────────────────────────────────────────
  // Row 1 — product-facing columns (Products / Sports / Solutions /
  // Enterprise / Personas / Regions).
  // ─────────────────────────────────────────────────────────────────
  const rowOne: readonly FooterColumn[] = [
    {
      key: "products",
      title: t("columns.product"),
      links: [
        { label: t("product.athletes"), href: "/products/athletes" },
        { label: t("product.teams"), href: "/products/teams" },
        { label: t("product.scheduling"), href: "/products/scheduling" },
        { label: t("product.payments"), href: "/products/payments" },
        { label: t("product.performance"), href: "/products/performance" },
        { label: t("product.reception"), href: "/products/reception" },
        { label: t("product.reports"), href: "/products/reports" },
        { label: t("product.safeguarding"), href: "/products/safeguarding" },
        { label: t("product.aiAssistant"), href: "/products/ai" },
        { label: t("product.attributeEngine"), href: "/products/attribute-engine" },
      ],
    },
    {
      key: "sports",
      title: t("columns.sports"),
      links: [
        { label: t("sports.football"), href: "/sports/football" },
        { label: t("sports.swimming"), href: "/sports/swimming" },
        { label: t("sports.basketball"), href: "/sports/basketball" },
        { label: t("sports.tennis"), href: "/sports/tennis" },
        { label: t("sports.martialArts"), href: "/sports/martial-arts" },
        { label: t("sports.gymnastics"), href: "/sports/gymnastics" },
        {
          label: t("sports.volleyball"),
          href: "/sports/volleyball",
          badge: t("sports.comingSoon"),
        },
        {
          label: t("sports.padel"),
          href: "/sports/padel",
          badge: t("sports.comingSoon"),
        },
        {
          label: t("sports.athletics"),
          href: "/sports/athletics",
          badge: t("sports.comingSoon"),
        },
      ],
    },
    {
      key: "solutions",
      title: t("columns.solutions"),
      links: [
        { label: t("solutions.multiBranch"), href: "/solutions/multi-branch" },
        { label: t("solutions.multiTenant"), href: "/solutions/multi-tenant" },
        { label: t("solutions.sportAgnostic"), href: "/solutions/sport-agnostic" },
        { label: t("solutions.rtlBilingual"), href: "/solutions/rtl-bilingual" },
        { label: t("solutions.offlineFirst"), href: "/solutions/offline-first" },
      ],
    },
    {
      key: "enterprise",
      title: t("columns.enterprise"),
      links: [
        { label: t("enterprise.security"), href: "/enterprise/security" },
        { label: t("enterprise.onboarding"), href: "/enterprise/onboarding" },
        { label: t("enterprise.contracts"), href: "/enterprise/contracts" },
        { label: t("enterprise.talkToSales"), href: "/contact-sales" },
        { label: t("enterprise.customerStories"), href: "/customers" },
      ],
    },
    {
      key: "personas",
      title: t("columns.personas"),
      links: [
        { label: t("personas.owners"), href: "/personas/owners" },
        { label: t("personas.coaches"), href: "/personas/coaches" },
        { label: t("personas.athletes"), href: "/personas/athletes" },
        { label: t("personas.guardians"), href: "/personas/guardians" },
        { label: t("personas.frontDesk"), href: "/personas/front-desk" },
        { label: t("personas.finance"), href: "/personas/finance" },
        { label: t("personas.platformAdmins"), href: "/personas/platform-admins" },
      ],
    },
    {
      key: "regions",
      title: t("columns.regions"),
      links: [
        { label: t("regions.mena"), href: "/regions/mena" },
        { label: t("regions.europe"), href: "/regions/europe" },
        { label: t("regions.americas"), href: "/regions/americas" },
        { label: t("regions.dataResidency"), href: "/regions/data-residency" },
        { label: t("regions.localisedInvoicing"), href: "/regions/localised-invoicing" },
      ],
    },
  ];

  // ─────────────────────────────────────────────────────────────────
  // Row 2 — company + resources + legal columns.
  // Build / Learn / Explore / Company / Legal & Trust / Social.
  //
  // Explore + Social iterate over `site.social.*` so a missing handle
  // silently drops the row rather than rendering a broken `#` anchor.
  // ─────────────────────────────────────────────────────────────────
  const exploreLinks: FooterLink[] = [{ label: t("explore.roadmap"), href: changelogUrl }];

  if (site.social.community) {
    exploreLinks.push({ label: t("explore.community"), href: site.social.community });
  }

  if (site.social.github) {
    exploreLinks.push({ label: t("explore.github"), href: site.social.github });
  }

  exploreLinks.push(
    { label: t("explore.templates"), href: "/templates" },
    { label: t("explore.integrations"), href: "/integrations" },
  );

  const socialLinks: FooterLink[] = [];

  if (site.social.github) {
    socialLinks.push({ label: t("social.github"), href: site.social.github });
  }

  if (site.social.twitter) {
    socialLinks.push({ label: t("social.x"), href: site.social.twitter });
  }

  if (linkedinHref) {
    socialLinks.push({ label: t("social.linkedin"), href: linkedinHref });
  }

  const rowTwo: readonly FooterColumn[] = [
    {
      key: "build",
      title: t("columns.build"),
      links: [
        { label: t("build.docs"), href: docsUrl },
        { label: t("build.apiReference"), href: `${docsUrl}/api-reference` },
        { label: t("build.gettingStarted"), href: `${docsUrl}/getting-started` },
        { label: t("build.changelog"), href: changelogUrl },
        { label: t("build.status"), href: statusUrl },
      ],
    },
    {
      key: "learn",
      title: t("columns.learn"),
      links: [
        { label: t("learn.blog"), href: "/blog" },
        { label: t("learn.customerStories"), href: "/customers" },
        { label: t("learn.guides"), href: `${docsUrl}/guides` },
        { label: t("learn.videoTutorials"), href: tutorialsUrl },
        { label: t("learn.newsletter"), href: "/newsletter" },
      ],
    },
    {
      key: "explore",
      title: t("columns.explore"),
      links: exploreLinks,
    },
    {
      key: "company",
      title: t("columns.company"),
      links: [
        { label: t("company.about"), href: "/about" },
        { label: t("company.careers"), href: "/careers" },
        { label: t("company.press"), href: "/press" },
        { label: t("company.contact"), href: "/contact" },
        { label: t("company.partners"), href: "/partners" },
      ],
    },
    {
      key: "trust",
      title: t("columns.trust"),
      links: [
        { label: t("trust.privacy"), href: "/legal/privacy" },
        { label: t("trust.terms"), href: "/legal/terms" },
        { label: t("trust.security"), href: "/legal/security" },
        { label: t("trust.dpa"), href: "/legal/dpa" },
        { label: t("trust.cookies"), href: "/legal/cookies" },
        { label: t("trust.acceptableUse"), href: "/legal/acceptable-use" },
      ],
    },
    {
      key: "social",
      title: t("columns.social"),
      links: socialLinks,
    },
  ];

  return (
    <footer className="border-t border-default bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 lg:px-8">
        {/* Row 1 — product-facing */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {rowOne.map((column) => (
            <ColumnBlock key={column.key} column={column} />
          ))}
        </div>

        {/* Row 2 — company + resources + legal, separated by generous space */}
        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {rowTwo.map((column) => (
            <ColumnBlock key={column.key} column={column} />
          ))}
        </div>

        <Separator className="my-12" />

        {/* Utility bar — brand + copyright on the leading edge, controls on the trailing edge. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3">
            <Link
              aria-label={site.name}
              className="inline-flex items-center gap-2 self-start text-accent transition-opacity hover:opacity-80"
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
            <p className="max-w-md text-sm text-muted">{site.tagline}</p>
            <p className="text-xs text-muted">{t("copyright", { year, name: site.name })}</p>
          </div>

          {/* Utility strip. Flex-wrap so mobile stacks the controls cleanly
              rather than shoving them past the viewport edge. */}
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusIndicator />
            <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-default sm:inline-block" />
            <LanguageSwitcher placement="top end" variant="compact" />
            <ThemeSwitch />
            <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-default sm:inline-block" />
            <RegionSelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
