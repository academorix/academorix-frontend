/**
 * @file cta-button.tsx
 * @module components/marketing/cta-button
 *
 * @description
 * Resolves a locale-collapsed CTA descriptor to a rendered pill-
 * styled anchor. Every marketing surface routes its CTAs through
 * this component so the intent-to-URL mapping stays centralized:
 *
 *   - `signup` → `${envConfig.appUrl}/signup`
 *   - `trial`  → `${envConfig.appUrl}/signup?trial=true`
 *   - `contact_sales` → `/contact-sales` on the marketing site
 *   - `link` → the descriptor's `href` (marketing-relative or absolute)
 *
 * External links (dashboard, docs) render as `<a target="_blank">`.
 * Marketing-relative links render as Next `<Link>` so client-side
 * transitions stay snappy.
 */

import clsx from "clsx";
import Link from "next/link";

import type { CtaType } from "@/lib/types";

import { envConfig } from "@/config/env.config";

/** The locale-collapsed CTA shape this component consumes. */
export interface CtaButtonCta {
  label: string;
  type: CtaType;
  href?: string;
}

/** Visual variant. */
type CtaVariant = "primary" | "ghost";

/** Props for {@link CtaButton}. */
export interface CtaButtonProps {
  cta: CtaButtonCta;
  variant?: CtaVariant;
  className?: string;
}

/** Resolve the CTA's intent to an absolute or relative URL. */
function resolveHref(cta: CtaButtonCta): string {
  switch (cta.type) {
    case "signup":
      return `${envConfig.appUrl}/signup`;
    case "trial":
      return `${envConfig.appUrl}/signup?trial=true`;
    case "contact_sales":
      return "/contact-sales";
    case "link":
      return cta.href ?? "#";
  }
}

/** True when the URL points off-marketing (dashboard, docs, external). */
function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Renders a marketing CTA anchor. */
export function CtaButton({ cta, variant = "primary", className }: CtaButtonProps) {
  const href = resolveHref(cta);
  const external = isExternal(href);

  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors";
  const variants: Record<CtaVariant, string> = {
    primary:
      "bg-accent text-accent-foreground shadow-sm hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    ghost:
      "border border-default/60 bg-surface/60 text-foreground backdrop-blur-sm hover:bg-default/40",
  };

  const classes = clsx(base, variants[variant], className);

  if (external) {
    return (
      <a className={classes} href={href} rel="noreferrer" target="_blank">
        {cta.label}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {cta.label}
    </Link>
  );
}
