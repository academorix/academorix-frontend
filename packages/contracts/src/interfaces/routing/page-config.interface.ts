/**
 * @file page-config.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Configuration shape returned by `definePage(...)`.
 *
 *   Every page module colocates a `default` component export and a
 *   `page` config export of this shape. The framework's route adapter
 *   consumes both and produces the RRv7 `RouteObject` under the hood.
 */

import type { ComponentType } from "react";
import type { IAccessSpec } from "./access-spec.interface";
import type { IErrorProps } from "./error-props.interface";
import type { ILinkTag } from "./link-tag.interface";
import type { IOverlayConfig } from "./overlay-config.interface";
import type { IPageContext } from "./page-context.interface";
import type { IPrerenderContext } from "./prerender-context.interface";
import type { IRouteHistory } from "./route-history.interface";
import type { IRouteMode } from "./route-mode.interface";

/**
 * Loader argument shape passed to `page.load({params, request})`.
 */
export interface ILoaderArgs<TParams = Record<string, string>> {
  /** Path params for the route. */
  readonly params: Readonly<TParams>;

  /** The active `Request`. */
  readonly request: Request;
}

/**
 * Revalidation context passed to `page.revalidate(ctx)`. Mirrors RRv7's
 * `ShouldRevalidateFunctionArgs` but adds the loader data generic.
 */
export interface IRevalidateContext<TData = unknown> {
  /** URL of the route that owns the loader. */
  readonly currentUrl: URL;

  /** URL the router is navigating to. */
  readonly nextUrl: URL;

  /** Params for the current match. */
  readonly currentParams: Readonly<Record<string, string>>;

  /** Params for the next match. */
  readonly nextParams: Readonly<Record<string, string>>;

  /** Form action (when the transition was triggered by a form submit). */
  readonly formAction?: string;

  /** Form method (when applicable). */
  readonly formMethod?: string;

  /**
   * Whether RRv7 would revalidate by default. Passing this through
   * gives callers a "let RRv7 decide" escape hatch.
   */
  readonly defaultShouldRevalidate: boolean;

  /** Optional action result — when the transition follows an `action()`. */
  readonly actionResult?: unknown;

  /** Current loader data. */
  readonly currentData?: TData;
}

/**
 * Full page module configuration.
 *
 * @typeParam TData - Return type of `load(...)`.
 * @typeParam TParams - Path param bag.
 */
export interface IPageConfig<TData = unknown, TParams = Record<string, string>> {
  /** Data loader — receives `{params, request}`, returns `TData`. */
  readonly load?: (args: ILoaderArgs<TParams>) => Promise<TData> | TData;

  /**
   * Static or dynamic list of param bags to prerender.
   *
   * - `true` — prerender the route once with `params = {}`.
   * - `false` / omitted — SPA fallback only.
   * - `(ctx) => readonly TParams[]` — invoke at build time; one output
   *   per param bag.
   */
  readonly prerender?:
    boolean | ((ctx: IPrerenderContext) => Promise<readonly TParams[]> | readonly TParams[]);

  /**
   * Should the loader re-run? Bridges RRv7's `shouldRevalidate` in
   * a framework-native shape.
   */
  readonly revalidate?: (ctx: IRevalidateContext<TData>) => boolean;

  /**
   * Stores whose mutations should trigger `revalidator.revalidate()`.
   * When `@stackra/state` is installed, the framework subscribes to
   * every listed store at mount. Off when the peer isn't installed.
   */
  readonly invalidateOn?: readonly unknown[];

  /** SEO descriptor — richer than RRv7's `meta`. */
  readonly seo?: unknown | ((ctx: IPageContext<TData, TParams>) => unknown);

  /** Breadcrumb text (or function of the context). */
  readonly breadcrumb?: string | ((ctx: IPageContext<TData, TParams>) => string);

  /** Analytics event fired on navigation. */
  readonly analytics?: unknown | ((ctx: IPageContext<TData, TParams>) => unknown);

  /**
   * Guards to run before render. Concatenated with inherited guards.
   * Elements are class refs, string names, or descriptor objects
   * (`{name, args}`).
   */
  readonly guards?: readonly unknown[];

  /** Middleware run for the route. Concatenated with inherited. */
  readonly middleware?: readonly unknown[];

  /** Fallback rendered while the loader runs. */
  readonly LoadingComponent?: ComponentType;

  /** Fallback rendered during a route transition. */
  readonly PendingComponent?: ComponentType;

  /** Fallback rendered when the loader / component throws. */
  readonly ErrorComponent?: ComponentType<IErrorProps>;

  /** Fallback rendered when `notFound()` fires. */
  readonly NotFoundComponent?: ComponentType;

  /**
   * Fallback rendered when the loader returns a value that
   * `isEmpty(data)` classifies as empty.
   */
  readonly EmptyComponent?: ComponentType;

  /**
   * Predicate consulted after the loader returns — if it returns
   * `true`, the framework renders `EmptyComponent` instead of the
   * default component.
   */
  readonly isEmpty?: (data: TData) => boolean;

  /** History-control descriptor. */
  readonly history?: IRouteHistory;

  /** Presentation mode — `page` (default) / `dialog` / `drawer` / `sheet`. */
  readonly mode?: IRouteMode;

  /** Overlay configuration — only used when `mode !== 'page'`. */
  readonly overlay?: IOverlayConfig;

  /** Access shortcut — sugar over guards. */
  readonly access?: IAccessSpec;

  /** Extra `<link>` tags contributed to the document head. */
  readonly head?:
    readonly ILinkTag[] | ((ctx: IPageContext<TData, TParams>) => readonly ILinkTag[]);

  /**
   * A11y announcement text (or callback) fired on navigation. Pass
   * `false` to opt out.
   */
  readonly announce?: string | ((ctx: IPageContext<TData, TParams>) => string) | false;
}
