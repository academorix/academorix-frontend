/**
 * @file breadcrumbs.interface.ts
 * @module @stackra/routing/react/components/breadcrumbs
 * @description Props for the routing `<Breadcrumbs />` component.
 */

import type { ReactNode } from "react";

/**
 * Props accepted by `<Breadcrumbs />`.
 */
export interface IBreadcrumbsProps {
  /** Visual separator between crumbs. Default is `'/'`. */
  readonly separator?: ReactNode;

  /** Label for the leading home crumb — omit to hide the entry. */
  readonly homeLabel?: string;

  /** Optional icon for the home crumb (rendered before the label). */
  readonly homeIcon?: ReactNode;

  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}
