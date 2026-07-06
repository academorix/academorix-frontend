/**
 * @file coming-soon.tsx
 * @module components/marketing/coming-soon
 *
 * @description
 * Shared "coming soon" empty state for marketing routes that haven't shipped
 * their real content yet (blog, docs, changelog, customer stories,
 * newsletter). Server Component; renders a centred hero with an eyebrow,
 * big title, description, and one or two CTAs.
 *
 * The primary CTA defaults to a mailto to the site's contact address — for
 * routes that want a different destination (e.g. `/docs` → the external
 * docs site), pass an explicit `primaryHref`.
 */

import { ArrowRightIcon } from "@academorix/ui/icons/outline";

import type { IconType } from "@academorix/ui/icons";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { isExternalHref } from "@/lib/marketing/cta";

/** Props for {@link ComingSoon}. */
interface ComingSoonProps {
  /** Small pill-style eyebrow above the title. */
  eyebrow: string;
  /** Main heading. */
  title: string;
  /** Supporting paragraph. */
  description: string;
  /** Big decorative icon on the right panel. */
  icon: IconType;
  /** Primary CTA label (defaults to "Get notified"). */
  primaryLabel?: string;
  /** Primary CTA href (defaults to `mailto:hello@academorix.com`). */
  primaryHref?: string;
  /** Optional secondary CTA — label + href. */
  secondaryLabel?: string;
  secondaryHref?: string;
}

/**
 * Renders a branded "coming soon" state for a marketing route.
 *
 * Not wrapped in `<MarketingShell />` — the calling page is expected to
 * wrap this in the shell so consumers can compose extra sections around
 * it if they want.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  icon: Icon,
  primaryLabel = "Get notified",
  primaryHref = "mailto:hello@academorix.com",
  secondaryLabel,
  secondaryHref,
}: ComingSoonProps): ReactNode {
  return (
    <section
      aria-labelledby="coming-soon-heading"
      className="mx-auto w-full max-w-6xl px-6 pt-20 pb-24"
    >
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase">
            {eyebrow}
          </span>
          <h1
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            id="coming-soon-heading"
          >
            {title}
          </h1>
          <p className="max-w-2xl text-lg text-muted">{description}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90"
              href={primaryHref}
              rel={isExternalHref(primaryHref) ? "noreferrer" : undefined}
            >
              {primaryLabel}
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </a>
            {secondaryLabel && secondaryHref ? (
              isExternalHref(secondaryHref) ? (
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40"
                  href={secondaryHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  {secondaryLabel}
                </a>
              ) : (
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40"
                  href={secondaryHref}
                >
                  {secondaryLabel}
                </Link>
              )
            ) : null}
          </div>
        </div>

        {/* Decorative right panel. */}
        <div className="hidden md:flex md:justify-end">
          <div className="flex size-64 items-center justify-center rounded-3xl bg-gradient-to-br from-accent/20 via-surface to-surface lg:size-80">
            <Icon aria-hidden="true" className="size-24 text-accent lg:size-32" />
          </div>
        </div>
      </div>
    </section>
  );
}
