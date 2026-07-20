/**
 * @file breadcrumb-entry.interface.ts
 * @module @stackra/routing/react/hooks/use-breadcrumbs
 * @description A single breadcrumb entry — one per matched route
 *   that contributes a `breadcrumb` field.
 */

/**
 * A breadcrumb entry for one match in the current chain.
 */
export interface IBreadcrumbEntry {
  /** Display label. */
  readonly label: string;

  /** Full path for this match. */
  readonly path: string;

  /** Whether this entry is the deepest (currently-active) match. */
  readonly isCurrent: boolean;

  /** Path params for this match. */
  readonly params: Readonly<Record<string, string>>;
}
