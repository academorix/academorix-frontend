/**
 * @file index.ts
 * @module @stackra/routing/seo/json-ld
 * @description Public API barrel for the SEO JSON-LD builders.
 *
 *   One builder per file — each produces a well-formed Schema.org
 *   node consumed by `SeoService.collect(...)` and the
 *   `<SeoHead />` renderer.
 */

export { article } from "./article.util";
export { breadcrumbList } from "./breadcrumb-list.util";
export { faqPage } from "./faq-page.util";
export { organization } from "./organization.util";
export { product } from "./product.util";
export { qaPage } from "./qa-page.util";
export { speakable } from "./speakable.util";
export { webPage } from "./web-page.util";
export { website } from "./website.util";
