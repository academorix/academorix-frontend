/**
 * @file breadcrumb-entry-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for a single entry in the
 *   `breadcrumbList(...)` JSON-LD builder — one `ListItem` in a
 *   Schema.org `BreadcrumbList`.
 */

/**
 * One breadcrumb entry.
 */
export interface IBreadcrumbEntryInput {
  /** Human-readable label. */
  readonly name: string;
  /** Absolute URL for the crumb. */
  readonly url: string;
}
