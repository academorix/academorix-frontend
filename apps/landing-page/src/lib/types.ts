/**
 * @file types.ts
 * @module lib/types
 *
 * @description
 * Shared TypeScript shapes for the marketing app's content model. Every JSON
 * fixture under `public/data/` conforms to one of the types declared here,
 * and every `lib/api/*.ts` reader returns one of these types.
 *
 * ## Icon encoding
 *
 * Every place a UI icon appears in a fixture, the JSON stores its **string
 * key** (`"UserGroupIcon"`, `"CreditCardIcon"`, …). Callers resolve the
 * string via `resolveIcon()` from `@/lib/icon-registry` at render time. See
 * that file for the full registry.
 *
 * ## CTA encoding
 *
 * Marketing CTAs never bake absolute URLs into the JSON. They store an
 * intent (`"signup"` / `"trial"` / `"contact_sales"` / `"link"`) plus an
 * optional path, and the render layer resolves the intent to the current
 * SPA / marketing URL via `lib/env.ts` + `lib/routes.ts`. That way rotating
 * the tenant SPA to a new domain doesn't require re-editing every JSON file.
 */

// ─────────────────────────────────────────────────────────────────────
// Common primitives
// ─────────────────────────────────────────────────────────────────────

/** How a marketing CTA behaves when pressed. */
export type CtaType = "signup" | "trial" | "contact_sales" | "link";

/** A single call-to-action button descriptor. */
export interface CtaDescriptor {
  /** Visible label. */
  label: string;
  /** What this button does when pressed. */
  type: CtaType;
  /**
   * When `type === "link"`, the target path (either marketing-relative or
   * absolute). Ignored for the other types.
   */
  href?: string;
}

/** A generic icon reference (string key resolved at render time). */
export type IconRef = string;

// ─────────────────────────────────────────────────────────────────────
// Site metadata
// ─────────────────────────────────────────────────────────────────────

/** A single link entry in the site nav / footer. */
export interface SiteNavLink {
  label: string;
  href: string;
}

/** Static marketing site metadata (name, tagline, links). */
export interface SiteData {
  name: string;
  tagline: string;
  description: string;
  contact_email: string;
  sales_email: string;
  nav_items: readonly SiteNavLink[];
  social: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    community?: string;
  };
  docs_url: string;
}

// ─────────────────────────────────────────────────────────────────────
// Mega menu
// ─────────────────────────────────────────────────────────────────────

/** A single link inside a mega-menu column. */
export interface MegaLink {
  label: string;
  href: string;
  badge?: string;
}

/** A small link column inside a mega-menu panel. */
export interface MegaMenuColumn {
  title: string;
  links: readonly MegaLink[];
}

/** An icon + title + description tile inside a mega-menu panel. */
export interface MegaMenuFeatureCard {
  icon: IconRef;
  title: string;
  description: string;
  href: string;
  badge?: string;
}

/** A right-column banner (icon + eyebrow + title + description + CTA). */
export interface MegaMenuBanner {
  eyebrow: string;
  title: string;
  description: string;
  cta_label: string;
  cta_href: string;
  icon: IconRef;
}

/** Composition of a single mega-menu panel. */
export interface MegaMenuPanel {
  layout: "columns-only" | "cards" | "cards-plus-banner";
  columns?: readonly MegaMenuColumn[];
  feature_cards?: readonly MegaMenuFeatureCard[];
  banner?: MegaMenuBanner;
}

/** A top-level nav entry. */
export type TopNavItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "menu"; label: string; panel: MegaMenuPanel };

/** The whole top nav — used by the desktop header + mobile drawer. */
export type NavData = readonly TopNavItem[];

// ─────────────────────────────────────────────────────────────────────
// Products (deep pages under /products/[slug])
// ─────────────────────────────────────────────────────────────────────

/** A sub-feature listed on a product deep page. */
export interface ProductFeature {
  icon: IconRef;
  title: string;
  description: string;
}

/** A cross-link rendered at the bottom of a product deep page. */
export interface RelatedLink {
  href: string;
  title: string;
  description: string;
}

/** An optional customer quote / use-case narrative. */
export interface CustomerQuote {
  quote: string;
  author: string;
  role: string;
  initials: string;
}

/** A single product's deep-page data. */
export interface ProductData {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  cta_label: string;
  cta_type: CtaType;
  hero_icon: IconRef;
  features: readonly ProductFeature[];
  use_case?: CustomerQuote;
  related: readonly RelatedLink[];
}

// ─────────────────────────────────────────────────────────────────────
// Sports (deep pages under /sports/[slug])
// ─────────────────────────────────────────────────────────────────────

/** A single sport's deep-page data. */
export interface SportData {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  hero_icon: IconRef;
  /** 5-8 sport-specific capability tiles. */
  features: readonly ProductFeature[];
  /** Optional testimonial from a coach/director in that sport. */
  testimonial?: CustomerQuote;
  related: readonly RelatedLink[];
}

// ─────────────────────────────────────────────────────────────────────
// Legal pages (deep pages under /legal/[slug])
// ─────────────────────────────────────────────────────────────────────

/** A single content block on a legal page — headline + paragraphs. */
export interface LegalSection {
  title: string;
  paragraphs: readonly string[];
}

/** A legal page (Privacy / Terms / Security / Cookies / DPA). */
export interface LegalData {
  slug: string;
  title: string;
  description: string;
  effective_date: string;
  sections: readonly LegalSection[];
}

// ─────────────────────────────────────────────────────────────────────
// Enterprise pages (deep pages under /enterprise/[slug])
// ─────────────────────────────────────────────────────────────────────

/** An enterprise-tier landing page (Security / Onboarding / Contracts). */
export interface EnterpriseData {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  hero_icon: IconRef;
  features: readonly ProductFeature[];
  related: readonly RelatedLink[];
}

// ─────────────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────────────

/** Backend plan key (mirrors `PlanKey`). */
export type PlanKey = "starter" | "growth" | "pro" | "enterprise";

/** Billing cadence (mirrors backend `BillingPeriod`). */
export type BillingPeriod = "monthly" | "yearly";

/** A single price for a plan (per billing period). */
export interface PlanPrice {
  billing_period: BillingPeriod;
  /** Decimal string or `"custom"` for Enterprise. */
  amount: string;
  currency: string;
}

/** CTA descriptor scoped to a plan tier. */
export interface PlanCta {
  label: string;
  type: "signup" | "trial" | "contact_sales";
}

/** A single plan tier. */
export interface PlanTierData {
  key: PlanKey;
  eyebrow: string;
  is_popular: boolean;
  description: string;
  highlights: readonly string[];
  prices: readonly PlanPrice[];
  cta: PlanCta;
  matrix_cta: PlanCta;
}

/** A pricing-page spotlight card ("No idle" / "Control your spending"). */
export interface PricingHighlight {
  title: string;
  description: string;
  learn_label: string;
  learn_href: string;
  /** Which built-in illustration variant to render. */
  illustration: "spending" | "growth";
}

/** A single comparison-matrix cell value. */
export type CompareCell =
  | { type: "included" }
  | { type: "excluded" }
  | { type: "value"; primary: string; secondary?: string }
  | { type: "custom" }
  | { type: "addon"; label?: string };

/** A single row in the comparison matrix. */
export interface CompareRow {
  label: string;
  info?: string;
  values: Partial<Record<PlanKey, CompareCell>>;
}

/** A sub-category inside a section (empty label = no sub-heading). */
export interface CompareSubcategory {
  label: string;
  rows: readonly CompareRow[];
}

/** A top-level section inside the comparison matrix. */
export interface CompareSection {
  icon: IconRef;
  title: string;
  description: string;
  subcategories: readonly CompareSubcategory[];
  regional_pricing_href?: string;
}

/** A single FAQ entry (question + answer). */
export interface FaqItem {
  question: string;
  answer: string;
}

// ─────────────────────────────────────────────────────────────────────
// Business types (create-workspace form)
// ─────────────────────────────────────────────────────────────────────

/** A single business-type option in the create-workspace form select. */
export interface BusinessTypeOption {
  id: string;
  label: string;
}

// ─────────────────────────────────────────────────────────────────────
// Password policy (mirrors backend)
// ─────────────────────────────────────────────────────────────────────

/** A single client-checkable password rule. */
export interface PasswordRuleData {
  id: string;
  label: string;
  /** Regex source (compiled at render time) or `"min_length"` sentinel. */
  test: string;
  /** Minimum length target when `test === "min_length"`. */
  min?: number;
}
