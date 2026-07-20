/**
 * @file seo-tag.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Neutral tag descriptor produced by the SEO builder.
 *
 *   The builder turns a resolved `ISeoDescriptor` into a flat list of
 *   `ISeoTag`s. This intermediate representation is framework-neutral:
 *   the React `<SeoHead />` maps each tag to a React element (F.2),
 *   and the prerender step maps each to an HTML string (F.3).
 */

/**
 * A single head tag.
 */
export interface ISeoTag {
  /** Element name. */
  readonly tag: "title" | "meta" | "link" | "script";
  /** Attributes to set. */
  readonly attrs: Readonly<Record<string, string>>;
  /** Inner text (`title` and JSON-LD `script`). */
  readonly text?: string;
  /** Stable React key + server dedupe key. */
  readonly key: string;
}
