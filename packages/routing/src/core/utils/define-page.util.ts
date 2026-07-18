/**
 * @file define-page.util.ts
 * @module @stackra/routing/core/utils
 * @description Typed identity helper for authoring a page module.
 *
 *   Page modules colocate a `default` component export and a `page`
 *   config export of shape {@link IPageConfig}. The framework's route
 *   adapter reads the module, extracts RRv7-shaped fields (`loader`,
 *   `meta`, `handle`), and returns the underlying `RouteObject`.
 */

import type { IPageConfig } from "@stackra/contracts";

/**
 * Typed identity for a page config.
 *
 * @typeParam TData   - Return type of `load(...)`.
 * @typeParam TParams - Path param bag.
 *
 * @param config - Page config.
 * @returns The same object, strictly typed against `IPageConfig`.
 *
 * @example
 * ```typescript
 * // src/pages/blog-post.tsx
 * import { definePage } from '@stackra/routing';
 * import type { IBlogPost } from '@/types';
 *
 * export default function BlogPostPage() { … }
 *
 * export const page = definePage<IBlogPost, { slug: string }>({
 *   load: async ({ params }) => fetchBlogPost(params.slug),
 *   seo: ({ data }) => ({ title: data.title, description: data.excerpt }),
 *   breadcrumb: ({ data }) => data.title,
 * });
 * ```
 */
export function definePage<TData = unknown, TParams = Record<string, string>>(
  config: IPageConfig<TData, TParams>,
): IPageConfig<TData, TParams> {
  return config;
}
