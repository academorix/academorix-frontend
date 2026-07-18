/**
 * @file index.ts
 * @module @stackra/routing/seo
 * @description Public API barrel for the SEO subsystem.
 *
 *   This barrel is BOTH the sub-domain's own barrel (imported inside
 *   the routing package via `@/seo`) AND the public
 *   `@stackra/routing/seo` subpath — consumers get JSON-LD builders,
 *   pipeline helpers, interfaces, `SeoService`, and `SeoModule` from
 *   the same entry point.
 */

// ── Module ──
export { SeoModule } from "./seo.module";

// ── Service ──
export { SeoService } from "./services";

// ── Descriptor + input interfaces ──
export type {
  IJsonLd,
  IRobotsDirective,
  IOpenGraphTags,
  IOpenGraphImage,
  ITwitterTags,
  IAlternateLink,
  ISeoDescriptor,
  ISeoTag,
  ISeoConfig,
  IArticleInput,
  IBreadcrumbEntryInput,
  IFaqEntryInput,
  IOrganizationInput,
  IProductInput,
  IQaPageInput,
  IWebPageInput,
  IWebsiteInput,
} from "./interfaces";

// ── JSON-LD builders ──
export {
  article,
  breadcrumbList,
  faqPage,
  organization,
  product,
  qaPage,
  speakable,
  webPage,
  website,
} from "./json-ld";

// ── Pipeline helpers ──
export { mergeDescriptors, buildSeoTags } from "./utils";
