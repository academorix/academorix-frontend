/**
 * @file index.ts
 * @module lib/api
 *
 * @description
 * Server-only getters for every content bucket the marketing app
 * renders. Each getter reads the matching `public/data/*.json`
 * fixture through the bilingual reader, collapses it to the
 * caller's locale, and returns a fully-typed `Localized<T>`.
 */

import "server-only";

import type {
  AuthorData,
  BlogPostData,
  BusinessTypeOption,
  CompanyPageData,
  CompareSection,
  CustomerStoryData,
  EnterpriseData,
  FaqItem,
  HomeData,
  LegalData,
  Localized,
  NavData,
  PasswordRuleData,
  PersonaData,
  PlanTierData,
  PricingHighlight,
  ProductData,
  SiteData,
  SolutionData,
  SportData,
  TestimonialData,
} from "@/lib/types";

import { readCollection, readCollectionEntry, readCollectionSlugs, readJson } from "@/lib/api/read";

// Global metadata
export async function getSite(locale: string): Promise<Localized<SiteData>> {
  return readJson<SiteData>("site", locale);
}
export async function getNav(locale: string): Promise<Localized<NavData>> {
  return readJson<NavData>("nav", locale);
}

// Landing
export async function getHome(locale: string): Promise<Localized<HomeData>> {
  return readJson<HomeData>("home", locale);
}

// Pricing
export async function getPlans(locale: string): Promise<Array<Localized<PlanTierData>>> {
  return readCollection<PlanTierData>("plans", locale);
}
export async function getPricingHighlights(
  locale: string,
): Promise<Array<Localized<PricingHighlight>>> {
  return readCollection<PricingHighlight>("pricing-highlights", locale);
}
export async function getPricingCompare(locale: string): Promise<Array<Localized<CompareSection>>> {
  return readCollection<CompareSection>("pricing-compare", locale);
}
export async function getFaq(locale: string): Promise<Array<Localized<FaqItem>>> {
  return readCollection<FaqItem>("faq", locale);
}

// Products
export async function getProducts(locale: string): Promise<Array<Localized<ProductData>>> {
  return readCollection<ProductData>("products", locale);
}
export async function getProduct(
  slug: string,
  locale: string,
): Promise<Localized<ProductData> | null> {
  return readCollectionEntry<ProductData>("products", slug, locale);
}
export async function getProductSlugs(): Promise<string[]> {
  return readCollectionSlugs("products");
}

// Sports
export async function getSports(locale: string): Promise<Array<Localized<SportData>>> {
  return readCollection<SportData>("sports", locale);
}
export async function getSport(slug: string, locale: string): Promise<Localized<SportData> | null> {
  return readCollectionEntry<SportData>("sports", slug, locale);
}
export async function getSportSlugs(): Promise<string[]> {
  return readCollectionSlugs("sports");
}

// Enterprise
export async function getEnterprisePages(
  locale: string,
): Promise<Array<Localized<EnterpriseData>>> {
  return readCollection<EnterpriseData>("enterprise", locale);
}
export async function getEnterprisePage(
  slug: string,
  locale: string,
): Promise<Localized<EnterpriseData> | null> {
  return readCollectionEntry<EnterpriseData>("enterprise", slug, locale);
}
export async function getEnterpriseSlugs(): Promise<string[]> {
  return readCollectionSlugs("enterprise");
}

// Solutions
export async function getSolutions(locale: string): Promise<Array<Localized<SolutionData>>> {
  return readCollection<SolutionData>("solutions", locale);
}
export async function getSolution(
  slug: string,
  locale: string,
): Promise<Localized<SolutionData> | null> {
  return readCollectionEntry<SolutionData>("solutions", slug, locale);
}
export async function getSolutionSlugs(): Promise<string[]> {
  return readCollectionSlugs("solutions");
}

// Personas
export async function getPersonas(locale: string): Promise<Array<Localized<PersonaData>>> {
  return readCollection<PersonaData>("personas", locale);
}
export async function getPersona(
  slug: string,
  locale: string,
): Promise<Localized<PersonaData> | null> {
  return readCollectionEntry<PersonaData>("personas", slug, locale);
}
export async function getPersonaSlugs(): Promise<string[]> {
  return readCollectionSlugs("personas");
}

// Legal
export async function getLegalPages(locale: string): Promise<Array<Localized<LegalData>>> {
  return readCollection<LegalData>("legal", locale);
}
export async function getLegalPage(
  slug: string,
  locale: string,
): Promise<Localized<LegalData> | null> {
  return readCollectionEntry<LegalData>("legal", slug, locale);
}
export async function getLegalSlugs(): Promise<string[]> {
  return readCollectionSlugs("legal");
}

// Company
export async function getCompanyPages(locale: string): Promise<Array<Localized<CompanyPageData>>> {
  return readCollection<CompanyPageData>("company", locale);
}
export async function getCompanyPage(
  slug: string,
  locale: string,
): Promise<Localized<CompanyPageData> | null> {
  return readCollectionEntry<CompanyPageData>("company", slug, locale);
}
export async function getCompanySlugs(): Promise<string[]> {
  return readCollectionSlugs("company");
}

// Customers
export async function getCustomerStories(
  locale: string,
): Promise<Array<Localized<CustomerStoryData>>> {
  return readCollection<CustomerStoryData>("customers", locale);
}
export async function getCustomerStory(
  slug: string,
  locale: string,
): Promise<Localized<CustomerStoryData> | null> {
  return readCollectionEntry<CustomerStoryData>("customers", slug, locale);
}
export async function getCustomerStorySlugs(): Promise<string[]> {
  return readCollectionSlugs("customers");
}

// Blog + authors
export async function getBlogPosts(locale: string): Promise<Array<Localized<BlogPostData>>> {
  const posts = await readCollection<BlogPostData>("blog", locale);

  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}
export async function getBlogPost(
  slug: string,
  locale: string,
): Promise<Localized<BlogPostData> | null> {
  return readCollectionEntry<BlogPostData>("blog", slug, locale);
}
export async function getBlogSlugs(): Promise<string[]> {
  return readCollectionSlugs("blog");
}
export async function getAuthors(locale: string): Promise<Array<Localized<AuthorData>>> {
  return readCollection<AuthorData>("authors", locale);
}
export async function getAuthor(
  slug: string,
  locale: string,
): Promise<Localized<AuthorData> | null> {
  return readCollectionEntry<AuthorData>("authors", slug, locale);
}

// Testimonials
export async function getTestimonials(locale: string): Promise<Array<Localized<TestimonialData>>> {
  return readCollection<TestimonialData>("testimonials", locale);
}

// Forms
export async function getBusinessTypes(
  locale: string,
): Promise<Array<Localized<BusinessTypeOption>>> {
  return readCollection<BusinessTypeOption>("business-types", locale);
}
export async function getPasswordRules(
  locale: string,
): Promise<Array<Localized<PasswordRuleData>>> {
  return readCollection<PasswordRuleData>("password-rules", locale);
}
