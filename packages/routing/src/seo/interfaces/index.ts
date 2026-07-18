/**
 * @file index.ts
 * @module @stackra/routing/seo/interfaces
 * @description Public API barrel for SEO-subsystem interfaces —
 *   the descriptor family + the JSON-LD builder input shapes.
 */

// ── Descriptor family ──
export type { IJsonLd } from "./json-ld.interface";
export type { IRobotsDirective } from "./robots-directive.interface";
export type { IOpenGraphImage, IOpenGraphTags } from "./open-graph-tags.interface";
export type { ITwitterTags } from "./twitter-tags.interface";
export type { IAlternateLink } from "./alternate-link.interface";
export type { ISeoDescriptor } from "./seo-descriptor.interface";
export type { ISeoTag } from "./seo-tag.interface";
export type { ISeoConfig } from "./seo-config.interface";

// ── JSON-LD builder input shapes ──
export type { IArticleInput } from "./article-input.interface";
export type { IBreadcrumbEntryInput } from "./breadcrumb-entry-input.interface";
export type { IFaqEntryInput } from "./faq-entry-input.interface";
export type { IOrganizationInput } from "./organization-input.interface";
export type { IProductInput } from "./product-input.interface";
export type { IQaPageInput } from "./qa-page-input.interface";
export type { IWebPageInput } from "./web-page-input.interface";
export type { IWebsiteInput } from "./website-input.interface";
