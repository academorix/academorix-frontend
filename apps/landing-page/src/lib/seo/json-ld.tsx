/**
 * @file json-ld.tsx
 * @module lib/seo/json-ld
 *
 * @description
 * Typed builders for the JSON-LD structured-data blocks embedded on
 * marketing pages. Search engines (Google, Bing, DuckDuckGo) read
 * these blocks to build rich snippets: brand knowledge panels, FAQ
 * accordions, product carousels, breadcrumb trails.
 *
 * Every builder returns a serializable object that a caller drops
 * into a `<script type="application/ld+json">` tag with
 * `JSON.stringify()`. See {@link JsonLd} for a convenience component
 * that does that safely with the recommended `dangerouslySetInnerHTML`
 * guard.
 *
 * ## Reference
 *
 *   - https://schema.org
 *   - https://developers.google.com/search/docs/appearance/structured-data
 */

import type { ReactElement } from "react";

/** Canonical Academorix identity used across every schema block. */
export interface OrganizationSchemaInput {
  /** Marketing origin, e.g. `https://academorix.com`. */
  siteUrl: string;
  /** Legal business name. */
  legalName?: string;
  /** Preferred display name (usually the same as legal). */
  name: string;
  /** Absolute URL to the wordmark logo. */
  logoUrl: string;
  /** Tagline shown on the home page hero. */
  description: string;
  /** Public social profiles for the `sameAs` array. */
  sameAs?: readonly string[];
  /** Contact email published on `/contact-sales`. */
  contactEmail?: string;
}

/**
 * Build an `Organization` schema for the marketing brand. Embed on
 * the root layout so every page carries the brand knowledge signal.
 */
export function organizationSchema(input: OrganizationSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${input.siteUrl}/#organization`,
    name: input.name,
    legalName: input.legalName ?? input.name,
    url: input.siteUrl,
    logo: {
      "@type": "ImageObject",
      url: input.logoUrl,
    },
    description: input.description,
    ...(input.sameAs && input.sameAs.length > 0 ? { sameAs: input.sameAs } : {}),
    ...(input.contactEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            email: input.contactEmail,
            contactType: "sales",
            availableLanguage: ["English", "Arabic"],
          },
        }
      : {}),
  };
}

/** WebSite schema for site-name + potential-action integration. */
export function websiteSchema(input: { siteUrl: string; name: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${input.siteUrl}/#website`,
    url: input.siteUrl,
    name: input.name,
    publisher: { "@id": `${input.siteUrl}/#organization` },
  };
}

/** SoftwareApplication schema used on product deep-dive pages. */
export interface ProductSchemaInput {
  siteUrl: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
}

export function productSchema(input: ProductSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${input.siteUrl}/products/${input.slug}#product`,
    name: input.name,
    description: input.description,
    applicationCategory: input.category,
    applicationSubCategory: "SportsAcademyManagement",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "USD",
      price: "0",
      description: "Free tier available. Growth from $99/month.",
    },
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    provider: { "@id": `${input.siteUrl}/#organization` },
  };
}

/** FAQPage schema — each Q/A becomes a rich-snippet accordion row. */
export interface FaqSchemaInput {
  items: ReadonlyArray<{ question: string; answer: string }>;
}

export function faqSchema(input: FaqSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: input.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** BreadcrumbList schema for deep-dive routes. */
export interface BreadcrumbSchemaInput {
  siteUrl: string;
  trail: ReadonlyArray<{ name: string; path: string }>;
}

export function breadcrumbSchema(input: BreadcrumbSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: input.trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${input.siteUrl}${crumb.path}`,
    })),
  };
}

/** Props for {@link JsonLd}. */
export interface JsonLdProps {
  schemas: ReadonlyArray<Record<string, unknown>>;
}

/**
 * Renders one or more JSON-LD blocks as a Server-safe React fragment.
 * Uses `dangerouslySetInnerHTML` so React doesn't escape the JSON —
 * crawlers require raw content in the `<script>` tag.
 */
export function JsonLd({ schemas }: JsonLdProps): ReactElement {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          key={index}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
