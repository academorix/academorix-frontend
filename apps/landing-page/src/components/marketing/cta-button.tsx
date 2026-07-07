/**
 * @file cta-button.tsx
 * @module components/marketing/cta-button
 *
 * @description
 * Resolves a locale-collapsed CTA descriptor to a rendered pill-
 * styled anchor. Every marketing surface routes its CTAs through
 * this component so the intent-to-URL mapping stays centralized:
 *
 *   - `signup` → `${envConfig.appUrl}/register`
 *   - `signin` → `${envConfig.appUrl}/login`
 *   - `trial`  → `${envConfig.appUrl}/register?trial=true`
 *   - `contact_sales` → `/contact-sales` on the marketing site
 *   - `link` → the descriptor's `href` (marketing-relative or absolute)
 *
 * ## Auth hand-off
 *
 * The dashboard owns the entire auth surface (register, login,
 * email verification, 2FA setup, workspace creation, onboarding).
 * Marketing CTAs hand off with a hard navigation so the dashboard's
 * own session bootstrap runs — no client-side session leakage
 * between the marketing origin and the app origin.
 *
 * The dashboard route paths live in
 * `apps/dashboard/src/lib/module/routes.ts` as `appRoutes.login`
 * and `appRoutes.register`. Keep these two in sync.
 *
 * External links (dashboard, docs) render as plain `<a>` anchors so
 * the browser performs a full page load. Marketing-relative links
 * render as Next `<Link>` so client-side transitions stay snappy.
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
      return `${envConfig.appUrl}/register`;
    case "signin":
      return `${envConfig.appUrl}/login`;
    case "trial":
      return `${envConfig.appUrl}/register?trial=true`;
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

/**
 * Auth handoffs (signup, signin, trial) navigate to the dashboard
 * origin. They render as plain `<a>` anchors targeting the same tab,
 * NEVER `target="_blank"`, so the user experiences a single fluid
 * navigation into the product's own auth surface.
 */
function isAuthHandoff(type: CtaType): boolean {
  return type === "signup" || type === "signin" || type === "trial";
}

/** Renders a marketing CTA anchor. */
export function CtaButton({ cta, variant = "primary", className }: CtaButtonProps) {
  const href = resolveHref(cta);
  const authHandoff = isAuthHandoff(cta.type);
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

  // Auth handoffs bounce to the dashboard origin in the same tab so
  // the product owns the full sign-in / register / verify flow.
  if (authHandoff) {
    return (
      <a className={classes} href={href}>
        {cta.label}
      </a>
    );
  }

  // Non-auth external links (docs, status page) open in a new tab so
  // the marketing tour is preserved.
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
