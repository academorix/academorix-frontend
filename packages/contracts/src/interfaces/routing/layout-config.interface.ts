/**
 * @file layout-config.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Configuration shape returned by `defineLayout(...)`.
 *
 *   A layout is a route that wraps children — no `load`, no
 *   `prerender`, no `analytics`, no `mode` / `overlay`.
 */

import type { ComponentType } from "react";
import type { IAccessSpec } from "./access-spec.interface";
import type { IErrorProps } from "./error-props.interface";
import type { ILinkTag } from "./link-tag.interface";
import type { IPageContext } from "./page-context.interface";
import type { IRouteHistory } from "./route-history.interface";

/**
 * Layout module configuration.
 */
export interface ILayoutConfig {
  /**
   * Guards to run before the layout renders. Concatenated with
   * inherited guards from parent matches.
   */
  readonly guards?: readonly unknown[];

  /**
   * Middleware run for the layout's route (by name or class reference).
   * Concatenated with inherited middleware.
   */
  readonly middleware?: readonly unknown[];

  /**
   * Static SEO defaults for the layout, or a function of the layout's
   * context. Layouts typically own site-wide SEO defaults; page
   * routes override.
   */
  readonly seo?: unknown | ((ctx: IPageContext<unknown>) => unknown);

  /**
   * Breadcrumb entry contributed by this layout (typically the root
   * or a section header — e.g. "Dashboard").
   */
  readonly breadcrumb?: string | ((ctx: IPageContext<unknown>) => string);

  /** Fallback rendered when a child route throws. */
  readonly ErrorComponent?: ComponentType<IErrorProps>;

  /** Fallback rendered while a child route loads. */
  readonly LoadingComponent?: ComponentType;

  /** Fallback rendered during a route transition. */
  readonly PendingComponent?: ComponentType;

  /**
   * Fallback rendered when the framework's `notFound()` signal fires
   * for a child route.
   */
  readonly NotFoundComponent?: ComponentType;

  /** History-control descriptor. */
  readonly history?: IRouteHistory;

  /** Access shortcut — sugar over guards. */
  readonly access?: IAccessSpec;

  /** Extra `<link>` tags contributed to the document head. */
  readonly head?: readonly ILinkTag[];

  /**
   * A11y announcement text (or callback returning it) for each route
   * transition under this layout. Pass `false` to opt out.
   */
  readonly announce?: string | ((ctx: IPageContext<unknown>) => string) | false;
}
