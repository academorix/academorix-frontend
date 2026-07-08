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

export type CtaType = "signup" | "signin" | "trial" | "contact_sales" | "link";

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

// ─── Showcase (Intercom-style tabbed product preview) ───────────────

/** Preset accent palette used to tint a showcase panel's backdrop. */
export type ShowcaseAccent = "indigo" | "amber" | "mint" | "purple" | "rose";

/**
 * A single labeled statistic rendered inside the mock preview card
 * of a showcase tab. Both `value` and `label` are bilingual so
 * numbers with unit suffixes ("42 new") localize cleanly.
 */
export interface HomeShowcaseStatCard {
  label: LocalizedString;
  value: LocalizedString;
  trend?: LocalizedString;
}

/** An item in the mock sidebar of a showcase preview card. */
export interface HomeShowcaseSidebarItem {
  label: LocalizedString;
  is_active: boolean;
}

/**
 * One tab inside the home-page product showcase. Each tab reveals a
 * full-width panel with a headline, description, feature bullets, a
 * CTA, and a stylized preview card that mimics the corresponding
 * product surface (window chrome + sidebar + stat cards).
 */
export interface HomeShowcaseTab {
  /** Stable, non-translatable identifier used as the tab key. */
  id: string;
  /** Icon key from `ICON_REGISTRY` — rendered next to the tab label. */
  icon: IconRef;
  /** Short tab-button label (fits comfortably in the tab list). */
  label: LocalizedString;
  /** Panel headline (H3-scale copy). */
  headline: LocalizedString;
  /** Panel supporting paragraph. */
  description: LocalizedString;
  /** Bulleted highlights rendered next to the preview card. */
  highlights: readonly LocalizedString[];
  /** CTA label + href jumping into the deep-dive product page. */
  cta_label: LocalizedString;
  cta_href: string;
  /** Which preset backdrop color the panel should paint with. */
  accent: ShowcaseAccent;
  /** Title bar text for the mock preview window. */
  window_title: LocalizedString;
  /** Faux sidebar items rendered on the left of the preview card. */
  sidebar_items: readonly HomeShowcaseSidebarItem[];
  /** Stat cards rendered in the main content area of the preview. */
  stat_cards: readonly HomeShowcaseStatCard[];
}

/** Full home-page product showcase section. */
export interface HomeShowcase {
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  tabs: readonly HomeShowcaseTab[];
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
  showcase: HomeShowcase;
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

/**
 * A numbered step in a "how it works" strip. Used by product /
 * sport / enterprise deep-dive pages as an in-page mini-tutorial
 * card that walks the reader through activation.
 */
export interface HowItWorksStep {
  number: string;
  title: LocalizedString;
  description: LocalizedString;
  icon: IconRef;
}

/**
 * A single labelled statistic rendered inside a rich preview card
 * (mock dashboard). Both `label`, `value`, and optional `trend` are
 * bilingual so localized number suffixes ("42 جديد") flow cleanly.
 */
export interface SampleMetric {
  label: LocalizedString;
  value: LocalizedString;
  trend?: LocalizedString;
}

/**
 * One row inside a sport-specific vocabulary table (positions for
 * football, strokes for swimming, apparatus for gymnastics, belts
 * for martial arts, etc.). `key` is a stable, non-translatable
 * identifier used as a React key and for anchoring links.
 */
export interface SportTerminologyItem {
  key: string;
  label: LocalizedString;
  description: LocalizedString;
  icon?: IconRef;
}

/**
 * A configurable attribute tracked for a specific sport (e.g.
 * dribbling, passing, shooting for football). `min`/`max` describe
 * the numeric range Academorix uses when displaying the attribute
 * on athlete profiles; `sample_value` is the illustrative fill
 * shown in mock previews so the marketing surface doesn't look
 * empty.
 */
export interface SportAttribute {
  key: string;
  label: LocalizedString;
  description: LocalizedString;
  min: number;
  max: number;
  sample_value: number;
}

/**
 * A workflow step reflecting the day-to-day life of a coach or
 * academy operator using Academorix. Rendered as a horizontal
 * numbered strip on sport / product / persona deep-dive pages.
 */
export interface WorkflowStep {
  number: string;
  title: LocalizedString;
  description: LocalizedString;
}

/**
 * A compliance certification tile shown on enterprise pages
 * (Security, Compliance). `status` supports honest posture
 * signals for standards that are audited-but-scheduled ("audit
 * scheduled Q4 2026") without over-claiming certification.
 */
export interface Certification {
  slug: string;
  label: LocalizedString;
  description: LocalizedString;
  status: "certified" | "scheduled" | "aligned" | "in-progress";
  icon: IconRef;
}

/**
 * A tool / platform Academorix integrates with. Grouped into
 * categories (Payments, Calendar, Comms, Auth, Analytics, etc.)
 * on product pages. `category` is a non-translatable enum for
 * ordering; `label` and `role` are bilingual customer-facing text.
 */
export interface IntegrationItem {
  key: string;
  label: LocalizedString;
  role: LocalizedString;
  category: LocalizedString;
}

/**
 * A single company value shown on `/about`. Renders as an icon
 * tile with a title + supporting paragraph.
 */
export interface CompanyValue {
  icon: IconRef;
  title: LocalizedString;
  description: LocalizedString;
}

/**
 * A press mention (published article about Academorix). Rendered
 * as a card with publication logo (initials), quote pull, and
 * outbound link.
 */
export interface PressMention {
  publication: LocalizedString;
  initials: string;
  quote: LocalizedString;
  date: string;
  href: string;
}

/**
 * Regional sales presence — used on `/contact-sales` and the
 * `/about` company page. `region` is a canonical code (`mena` /
 * `eu` / `us`) so the world-map SVG can highlight the right slice.
 */
export interface RegionalOffice {
  region: "mena" | "eu" | "us" | "apac";
  city: LocalizedString;
  country: LocalizedString;
  timezone: LocalizedString;
  languages: readonly LocalizedString[];
  email: string;
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

  // ─── Optional richer content (populated on flagship pages) ─────────
  /**
   * Long-form narrative paragraphs shown on the product deep-dive
   * page. Typically 3-5 paragraphs explaining "what is this product,
   * why does it exist, how does it fit the rest of Academorix".
   */
  narrative?: readonly LongFormParagraph[];
  /** Measurable outcome bullet list (e.g. "94% retention YoY"). */
  outcomes?: readonly LocalizedString[];
  /** Integration list grouped by category. */
  integrations?: readonly IntegrationItem[];
  /** Numbered "how it works" strip. */
  how_it_works?: readonly HowItWorksStep[];
  /** Technical spec bullet list. */
  technical_details?: readonly LocalizedString[];
  /** Sample stat cards for the mock preview surface. */
  sample_metrics?: readonly SampleMetric[];
  /** Absolute URL to a hero cover image (Unsplash CDN). */
  cover_image?: string;
  /** Alt text for `cover_image`. */
  cover_alt?: LocalizedString;
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

  // ─── Optional richer content ───────────────────────────────────────
  narrative?: readonly LongFormParagraph[];
  /** Positions / strokes / apparatus / belts / event types. */
  sport_terminology?: readonly SportTerminologyItem[];
  /** Configurable per-sport attribute set. */
  attribute_sets?: readonly SportAttribute[];
  /** Sample metrics for the mock preview surface. */
  sample_metrics?: readonly SampleMetric[];
  /** Daily coach workflow steps. */
  workflow_steps?: readonly WorkflowStep[];
  outcomes?: readonly LocalizedString[];
  cover_image?: string;
  cover_alt?: LocalizedString;
}

export interface EnterpriseData {
  slug: string;
  eyebrow: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  hero_icon: IconRef;
  features: readonly ProductFeature[];
  related: readonly RelatedLink[];

  // ─── Optional richer content ───────────────────────────────────────
  narrative?: readonly LongFormParagraph[];
  /** Certifications posture (SOC 2 scheduled, GDPR aligned, etc.). */
  certifications?: readonly Certification[];
  technical_details?: readonly LocalizedString[];
  how_it_works?: readonly HowItWorksStep[];
  outcomes?: readonly LocalizedString[];
  testimonial?: CustomerQuote;
  cover_image?: string;
  cover_alt?: LocalizedString;
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

  // ─── Optional richer content ───────────────────────────────────────
  outcomes?: readonly LocalizedString[];
  how_it_works?: readonly HowItWorksStep[];
  testimonial?: CustomerQuote;
  cover_image?: string;
  cover_alt?: LocalizedString;
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

  // ─── Optional richer content ───────────────────────────────────────
  outcomes?: readonly LocalizedString[];
  workflow_steps?: readonly WorkflowStep[];
  testimonial?: CustomerQuote;
  cover_image?: string;
  cover_alt?: LocalizedString;
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

  // ─── Optional richer content ───────────────────────────────────────
  values?: readonly CompanyValue[];
  press_mentions?: readonly PressMention[];
  offices?: readonly RegionalOffice[];
  cover_image?: string;
  cover_alt?: LocalizedString;
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

  // ─── Optional richer content ───────────────────────────────────────
  challenge?: readonly LongFormParagraph[];
  solution?: readonly LongFormParagraph[];
  outcome?: readonly LongFormParagraph[];
  cover_image?: string;
  cover_alt?: LocalizedString;
  logo_initials?: string;
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

  // ─── Optional richer content ───────────────────────────────────────
  /** Absolute URL to a real cover photo (Unsplash CDN). */
  cover_image?: string;
  cover_alt?: LocalizedString;
  tags?: readonly LocalizedString[];
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
