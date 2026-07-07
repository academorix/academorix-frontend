/**
 * @file types.ts
 * @module lib/types
 *
 * @description
 * Shared TypeScript shapes for every content JSON the marketing app
 * consumes.
 *
 * ## Bilingual leaves — `LocalizedString`
 *
 * Every user-visible string in `public/data/*.json` is stored as
 * `{ en: string; ar: string }`. The bilingual reader in
 * `src/lib/api/read.ts` walks the tree at request time and collapses
 * each leaf to the visitor's active locale, so every downstream page
 * still consumes plain `string`s via `Localized<T>`. This keeps the
 * source-of-truth data self-describing while page code stays simple.
 *
 * ## `Localized<T>` — post-collapse view
 *
 * Page code imports `Localized<HomeData>`, `Localized<ProductData>`,
 * etc. — the type-level equivalent of "run every `LocalizedString`
 * leaf through the reader and hand me back plain `string`s." That
 * way the JSON schema (bilingual) and the render schema (plain) are
 * always in lockstep and can never drift.
 *
 * ## Icons
 *
 * Every icon field stores the exact `IconKey` from
 * `@/lib/icon-registry`. Validation happens at render time via
 * `resolveIcon(key)`.
 *
 * ## CTAs
 *
 * Marketing CTAs never bake absolute URLs. They carry an intent
 * (`"signup"` / `"trial"` / `"contact_sales"` / `"link"`) plus an
 * optional path. The render layer resolves the intent against
 * `envConfig` so rotating the SPA to a new domain is a one-file
 * edit.
 */

// ═══════════════════════════════════════════════════════════════════
// Bilingual primitives
// ═══════════════════════════════════════════════════════════════════

/** A user-visible string in every supported locale. */
export interface LocalizedString {
  en: string;
  ar: string;
}

/**
 * Type-level operator that walks a shape and rewrites every
 * `LocalizedString` leaf to plain `string`. Everything else — slugs,
 * URLs, icon keys, enums, numbers, booleans — passes through
 * unchanged.
 */
export type Localized<T> = T extends LocalizedString
  ? string
  : T extends readonly (infer U)[]
    ? readonly Localized<U>[]
    : T extends (infer U)[]
      ? Localized<U>[]
      : T extends object
        ? { [K in keyof T]: Localized<T[K]> }
        : T;

// ═══════════════════════════════════════════════════════════════════
// CTA + shared primitives
// ═══════════════════════════════════════════════════════════════════

export type CtaType = "signup" | "trial" | "contact_sales" | "link";

export interface CtaDescriptor {
  label: LocalizedString;
  type: CtaType;
  href?: string;
}

export type IconRef = string;

// ═══════════════════════════════════════════════════════════════════
// site.json
// ═══════════════════════════════════════════════════════════════════

export interface SiteNavLink {
  label: LocalizedString;
  href: string;
}

export interface SiteSocial {
  github?: string;
  twitter?: string;
  linkedin?: string;
  community?: string;
}

export interface SiteData {
  name: string;
  tagline: LocalizedString;
  description: LocalizedString;
  contact_email: string;
  sales_email: string;
  nav_items: readonly SiteNavLink[];
  social: SiteSocial;
  docs_url: string;
}

// ═══════════════════════════════════════════════════════════════════
// nav.json
// ═══════════════════════════════════════════════════════════════════

export interface MegaLink {
  label: LocalizedString;
  href: string;
  badge?: LocalizedString;
}

export interface MegaMenuColumn {
  title: LocalizedString;
  links: readonly MegaLink[];
}

export interface MegaMenuFeatureCard {
  icon: IconRef;
  title: LocalizedString;
  description: LocalizedString;
  href: string;
  badge?: LocalizedString;
}

export interface MegaMenuBanner {
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  cta_label: LocalizedString;
  cta_href: string;
  icon: IconRef;
}

export interface MegaMenuPanel {
  layout: "columns-only" | "cards" | "cards-plus-banner";
  columns?: readonly MegaMenuColumn[];
  feature_cards?: readonly MegaMenuFeatureCard[];
  banner?: MegaMenuBanner;
}

export type TopNavItem =
  | { kind: "link"; label: LocalizedString; href: string }
  | { kind: "menu"; label: LocalizedString; panel: MegaMenuPanel };

export type NavData = readonly TopNavItem[];

// ═══════════════════════════════════════════════════════════════════
// home.json
// ═══════════════════════════════════════════════════════════════════

export interface HomeHero {
  eyebrow: LocalizedString;
  title: LocalizedString;
  subtitle: LocalizedString;
  cta_primary: CtaDescriptor;
  cta_secondary: CtaDescriptor;
  trust_line: LocalizedString;
}

export interface HomeKpi {
  value: number;
  suffix?: string;
  label: LocalizedString;
  caption: LocalizedString;
}

export interface HomeLogo {
  name: LocalizedString;
  initials?: string;
  logo_href?: string;
}

export interface HomeProductTile {
  slug: string;
  icon: IconRef;
  title: LocalizedString;
  description: LocalizedString;
  href: string;
  span?: "single" | "double";
}

export interface HomeSportTile {
  slug: string;
  icon: IconRef;
  title: LocalizedString;
  description: LocalizedString;
  href: string;
  is_supported: boolean;
  badge?: LocalizedString;
}

export interface HomeHowStep {
  number: string;
  title: LocalizedString;
  description: LocalizedString;
  icon: IconRef;
}

export interface HomePersonaCard {
  slug: string;
  icon: IconRef;
  title: LocalizedString;
  description: LocalizedString;
  cta_label: LocalizedString;
  cta_href: string;
}

export interface HomeTestimonial {
  quote: LocalizedString;
  author: LocalizedString;
  role: LocalizedString;
  org: LocalizedString;
  initials: string;
}

export interface HomePricingPreview {
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  cta_label: LocalizedString;
  cta_href: string;
}

export interface HomeCtaBand {
  title: LocalizedString;
  description: LocalizedString;
  cta_primary: CtaDescriptor;
  cta_secondary: CtaDescriptor;
}

export interface HomeFaqBlock {
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  items: readonly FaqItem[];
}

export interface HomeData {
  hero: HomeHero;
  kpi: readonly HomeKpi[];
  logos: {
    eyebrow: LocalizedString;
    caption: LocalizedString;
    items: readonly HomeLogo[];
  };
  products_bento: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    items: readonly HomeProductTile[];
  };
  sports_bento: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    items: readonly HomeSportTile[];
    footnote: LocalizedString;
  };
  how_it_works: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    steps: readonly HomeHowStep[];
  };
  personas: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    items: readonly HomePersonaCard[];
  };
  testimonials: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    items: readonly HomeTestimonial[];
  };
  pricing_preview: HomePricingPreview;
  cta_band: HomeCtaBand;
  faq: HomeFaqBlock;
}

// ═══════════════════════════════════════════════════════════════════
// products.json / sports.json / enterprise.json
// ═══════════════════════════════════════════════════════════════════

export interface ProductFeature {
  icon: IconRef;
  title: LocalizedString;
  description: LocalizedString;
}

export interface CustomerQuote {
  quote: LocalizedString;
  author: LocalizedString;
  role: LocalizedString;
  initials: string;
}

export interface RelatedLink {
  href: string;
  title: LocalizedString;
  description: LocalizedString;
}

export interface ProductData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  cta_label: LocalizedString;
  cta_type: CtaType;
  hero_icon: IconRef;
  features: readonly ProductFeature[];
  use_case?: CustomerQuote;
  related: readonly RelatedLink[];
}

export interface SportData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  hero_icon: IconRef;
  is_supported: boolean;
  features: readonly ProductFeature[];
  testimonial?: CustomerQuote;
  related: readonly RelatedLink[];
}

export interface EnterpriseData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  hero_icon: IconRef;
  features: readonly ProductFeature[];
  related: readonly RelatedLink[];
}

// ═══════════════════════════════════════════════════════════════════
// solutions.json / personas.json
// ═══════════════════════════════════════════════════════════════════

export type LongFormParagraph = LocalizedString;

export interface SolutionData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  hero_icon: IconRef;
  what_is: readonly LongFormParagraph[];
  features: readonly ProductFeature[];
  related: readonly RelatedLink[];
}

export interface PersonaData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  hero_icon: IconRef;
  what_is: readonly LongFormParagraph[];
  features: readonly ProductFeature[];
  related: readonly RelatedLink[];
}

// ═══════════════════════════════════════════════════════════════════
// legal.json
// ═══════════════════════════════════════════════════════════════════

export interface LegalSection {
  title: LocalizedString;
  paragraphs: readonly LocalizedString[];
}

export interface LegalData {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  effective_date: string;
  sections: readonly LegalSection[];
}

// ═══════════════════════════════════════════════════════════════════
// company.json
// ═══════════════════════════════════════════════════════════════════

export interface CompanyStat {
  value: LocalizedString;
  label: LocalizedString;
}

export interface CompanyTeamMember {
  name: string;
  role: LocalizedString;
  bio: LocalizedString;
  initials: string;
}

export interface CompanyMilestone {
  year: string;
  title: LocalizedString;
  description: LocalizedString;
}

export interface CompanyPageData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  hero_icon: IconRef;
  narrative: readonly LocalizedString[];
  stats?: readonly CompanyStat[];
  team?: readonly CompanyTeamMember[];
  milestones?: readonly CompanyMilestone[];
  related: readonly RelatedLink[];
}

// ═══════════════════════════════════════════════════════════════════
// customers.json
// ═══════════════════════════════════════════════════════════════════

export interface CustomerMetric {
  value: LocalizedString;
  label: LocalizedString;
}

export interface CustomerStoryData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  hero_icon: IconRef;
  vitals: {
    industry: LocalizedString;
    branches: LocalizedString;
    athletes: LocalizedString;
    sports: LocalizedString;
    based: LocalizedString;
  };
  metrics: readonly CustomerMetric[];
  narrative: readonly LocalizedString[];
  quote: CustomerQuote;
  related: readonly RelatedLink[];
}

// ═══════════════════════════════════════════════════════════════════
// blog.json / authors.json
// ═══════════════════════════════════════════════════════════════════

export interface BlogPostData {
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  date: string;
  author: string;
  reading_minutes: number;
  category: LocalizedString;
  hero_icon: IconRef;
  body: readonly LocalizedString[];
  related: readonly RelatedLink[];
}

export interface AuthorData {
  slug: string;
  name: string;
  role: LocalizedString;
  bio: LocalizedString;
  initials: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// testimonials.json (site-wide pool)
// ═══════════════════════════════════════════════════════════════════

export interface TestimonialData {
  slug: string;
  quote: LocalizedString;
  author: LocalizedString;
  role: LocalizedString;
  org: LocalizedString;
  initials: string;
  sport?: string;
  persona?: string;
}

// ═══════════════════════════════════════════════════════════════════
// plans.json / pricing-highlights.json / pricing-compare.json / faq.json
// ═══════════════════════════════════════════════════════════════════

export type PlanKey = "starter" | "growth" | "pro" | "enterprise";
export type BillingPeriod = "monthly" | "yearly";

export interface PlanPrice {
  billing_period: BillingPeriod;
  amount: string;
  currency: string;
}

export interface PlanCta {
  label: LocalizedString;
  type: "signup" | "trial" | "contact_sales";
}

export interface PlanTierData {
  key: PlanKey;
  eyebrow: LocalizedString;
  is_popular: boolean;
  description: LocalizedString;
  highlights: readonly LocalizedString[];
  prices: readonly PlanPrice[];
  cta: PlanCta;
  matrix_cta: PlanCta;
}

export interface PricingHighlight {
  title: LocalizedString;
  description: LocalizedString;
  learn_label: LocalizedString;
  learn_href: string;
  illustration: "spending" | "growth";
}

export type CompareCell =
  | { type: "included" }
  | { type: "excluded" }
  | { type: "value"; primary: LocalizedString; secondary?: LocalizedString }
  | { type: "custom" }
  | { type: "addon"; label?: LocalizedString };

export interface CompareRow {
  label: LocalizedString;
  info?: LocalizedString;
  values: Partial<Record<PlanKey, CompareCell>>;
}

export interface CompareSubcategory {
  label: LocalizedString;
  rows: readonly CompareRow[];
}

export interface CompareSection {
  icon: IconRef;
  title: LocalizedString;
  description: LocalizedString;
  subcategories: readonly CompareSubcategory[];
  regional_pricing_href?: string;
}

export interface FaqItem {
  slug: string;
  question: LocalizedString;
  answer: LocalizedString;
}

// ═══════════════════════════════════════════════════════════════════
// business-types.json / password-rules.json
// ═══════════════════════════════════════════════════════════════════

export interface BusinessTypeOption {
  id: string;
  label: LocalizedString;
}

export interface PasswordRuleData {
  id: string;
  label: LocalizedString;
  test: string;
  min?: number;
}
