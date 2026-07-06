/**
 * @file index.ts
 * @module lib/api
 *
 * @description
 * Public API surface for the marketing app's mock data layer. Every function
 * here reads from `public/data/{locale}/*.json` via the shared `read`
 * helper, so consumers never touch the filesystem directly and can be
 * swapped for a real backend / CMS call later without changing call-sites.
 *
 * ## Locale resolution
 *
 * Each getter accepts an explicit `locale` argument. Server Components at
 * the route level pass the locale resolved from `params` (or via
 * `getLocale()` from `next-intl/server`), so a page rendering under
 * `/ar/pricing` reads the Arabic plan copy and a page under `/pricing`
 * reads English. Missing localisations transparently fall back to English
 * inside `read.ts` — teams can ship translations incrementally.
 *
 * All functions return promises so the same signatures work with a future
 * `fetch()` implementation. Server Components can `await` them directly.
 */

import { notFound } from "next/navigation";

import type {
  BusinessTypeOption,
  CompareSection,
  EnterpriseData,
  FaqItem,
  LegalData,
  NavData,
  PasswordRuleData,
  PlanTierData,
  PricingHighlight,
  ProductData,
  SiteData,
  SportData,
} from "@/lib/types";

import { readCollection, readCollectionEntry, readCollectionSlugs, readJson } from "@/lib/api/read";

// ─────────────────────────────────────────────────────────────────────
// Site metadata
// ─────────────────────────────────────────────────────────────────────

/** Reads the marketing site's static metadata (name, tagline, links). */
export async function getSite(locale: string): Promise<SiteData> {
  return readJson<SiteData>("site", locale);
}

// ─────────────────────────────────────────────────────────────────────
// Top nav (mega menu)
// ─────────────────────────────────────────────────────────────────────

/** Reads the top nav definition used by the desktop mega menu + mobile drawer. */
export async function getNav(locale: string): Promise<NavData> {
  return readJson<NavData>("nav", locale);
}

// ─────────────────────────────────────────────────────────────────────
// Products (/products/[slug])
// ─────────────────────────────────────────────────────────────────────

/** Every product in the catalog. */
export async function getProducts(locale: string): Promise<ProductData[]> {
  return readCollection<ProductData>("products", locale);
}

/** Every product slug — used by `generateStaticParams()`. Locale-agnostic. */
export async function getProductSlugs(): Promise<string[]> {
  return readCollectionSlugs("products");
}

/** A single product by slug, or `null` if not found. */
export async function getProduct(slug: string, locale: string): Promise<ProductData | null> {
  return readCollectionEntry<ProductData>("products", slug, locale);
}

/**
 * Same as {@link getProduct} but throws Next's `notFound()` when absent.
 * Convenient inside route handlers.
 */
export async function getProductOrNotFound(slug: string, locale: string): Promise<ProductData> {
  const product = await getProduct(slug, locale);

  if (!product) {
    notFound();
  }

  return product;
}

// ─────────────────────────────────────────────────────────────────────
// Sports (/sports/[slug])
// ─────────────────────────────────────────────────────────────────────

/** Every sport in the catalog. */
export async function getSports(locale: string): Promise<SportData[]> {
  return readCollection<SportData>("sports", locale);
}

/** Every sport slug — used by `generateStaticParams()`. Locale-agnostic. */
export async function getSportSlugs(): Promise<string[]> {
  return readCollectionSlugs("sports");
}

/** A single sport by slug, or `null`. */
export async function getSport(slug: string, locale: string): Promise<SportData | null> {
  return readCollectionEntry<SportData>("sports", slug, locale);
}

/** Same as {@link getSport} but throws `notFound()` when absent. */
export async function getSportOrNotFound(slug: string, locale: string): Promise<SportData> {
  const sport = await getSport(slug, locale);

  if (!sport) {
    notFound();
  }

  return sport;
}

// ─────────────────────────────────────────────────────────────────────
// Legal pages (/legal/[slug])
// ─────────────────────────────────────────────────────────────────────

/** Every legal page. */
export async function getLegalPages(locale: string): Promise<LegalData[]> {
  return readCollection<LegalData>("legal", locale);
}

/** Every legal slug — locale-agnostic. */
export async function getLegalSlugs(): Promise<string[]> {
  return readCollectionSlugs("legal");
}

/** A single legal page by slug, or `null`. */
export async function getLegal(slug: string, locale: string): Promise<LegalData | null> {
  return readCollectionEntry<LegalData>("legal", slug, locale);
}

/** Same as {@link getLegal} but throws `notFound()` when absent. */
export async function getLegalOrNotFound(slug: string, locale: string): Promise<LegalData> {
  const page = await getLegal(slug, locale);

  if (!page) {
    notFound();
  }

  return page;
}

// ─────────────────────────────────────────────────────────────────────
// Enterprise pages (/enterprise/[slug])
// ─────────────────────────────────────────────────────────────────────

/** Every enterprise page. */
export async function getEnterprisePages(locale: string): Promise<EnterpriseData[]> {
  return readCollection<EnterpriseData>("enterprise", locale);
}

/** Every enterprise slug — locale-agnostic. */
export async function getEnterpriseSlugs(): Promise<string[]> {
  return readCollectionSlugs("enterprise");
}

/** A single enterprise page by slug, or `null`. */
export async function getEnterprise(slug: string, locale: string): Promise<EnterpriseData | null> {
  return readCollectionEntry<EnterpriseData>("enterprise", slug, locale);
}

/** Same as {@link getEnterprise} but throws `notFound()` when absent. */
export async function getEnterpriseOrNotFound(
  slug: string,
  locale: string,
): Promise<EnterpriseData> {
  const page = await getEnterprise(slug, locale);

  if (!page) {
    notFound();
  }

  return page;
}

// ─────────────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────────────

/** The four public plan tiers. */
export async function getPlans(locale: string): Promise<PlanTierData[]> {
  return readJson<PlanTierData[]>("plans", locale);
}

/** The two pricing spotlight cards. */
export async function getPricingHighlights(locale: string): Promise<PricingHighlight[]> {
  return readJson<PricingHighlight[]>("pricing-highlights", locale);
}

/** The full feature-comparison matrix. */
export async function getPricingCompare(locale: string): Promise<CompareSection[]> {
  return readJson<CompareSection[]>("pricing-compare", locale);
}

/** Numbered FAQ items. */
export async function getFaq(locale: string): Promise<FaqItem[]> {
  return readJson<FaqItem[]>("faq", locale);
}

// ─────────────────────────────────────────────────────────────────────
// Onboarding form data
// ─────────────────────────────────────────────────────────────────────

/** Business-type options for the create-workspace form. */
export async function getBusinessTypes(locale: string): Promise<BusinessTypeOption[]> {
  return readJson<BusinessTypeOption[]>("business-types", locale);
}

/** Password rules mirrored from the backend policy. */
export async function getPasswordRules(locale: string): Promise<{
  min_length: number;
  rules: readonly PasswordRuleData[];
}> {
  return readJson("password-rules", locale);
}
