/**
 * @file link.interface.ts
 * @module @stackra/routing/react/components/link
 * @description Props for the routing `<Link>` component.
 */

import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Prefetch strategy per PLAN v3.11.3.
 *
 * - `'hover'`  — start fetch on `onPointerEnter` / `onFocus` (default).
 * - `'intent'` — start on user intent (`onPointerDown` / `onKeyDown`
 *   / `onTouchStart`). Faster than 'hover' with more false positives.
 * - `'render'` — start on mount. Aggressive; use above the fold only.
 * - `'off'`    — never prefetch.
 */
export type ILinkPrefetch = "hover" | "intent" | "render" | "off";

/**
 * Props accepted by `<Link>`. Extends every standard `<a>` attribute
 * except `href` (which the framework derives from `to`).
 */
export interface ILinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** Destination — a pathname or absolute URL. */
  readonly to: string;

  /**
   * Prefetch strategy.
   *
   * @default 'hover'
   */
  readonly prefetch?: ILinkPrefetch;

  /**
   * When `true`, the navigation replaces the current history entry
   * instead of pushing.
   *
   * @default false
   */
  readonly replace?: boolean;

  /** Rendered children — link body. */
  readonly children?: ReactNode;
}
