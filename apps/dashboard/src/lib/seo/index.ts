/**
 * @file index.ts
 * @module lib/seo
 *
 * @description
 * Public barrel for the small SEO/metadata layer: the
 * {@link useDocumentMetadata} hook that manages `<title>` + description +
 * OpenGraph + Twitter card tags per public page. See the hook's docblock for
 * the rationale (no `react-helmet` dependency).
 */

export { useDocumentMetadata } from "@/lib/seo/use-document-metadata";
export type { DocumentMetadata } from "@/lib/seo/use-document-metadata";
