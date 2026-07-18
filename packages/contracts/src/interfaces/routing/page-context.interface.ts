/**
 * @file page-context.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Runtime context passed to every function-valued
 *   field of a `definePage(...)` config (`seo`, `breadcrumb`,
 *   `analytics`, ...).
 */

import type { IMatchDescriptor } from "./match-descriptor.interface";

/**
 * Context object passed to every "value OR function" field in
 * `definePage(...)`. One shape learned once, used everywhere.
 *
 * @typeParam TData - Return type of the page's `load(...)`.
 * @typeParam TParams - Path param bag.
 */
export interface IPageContext<TData = unknown, TParams = Record<string, string>> {
  /** Loader return value. */
  readonly data: TData;

  /** Path params for the current match. */
  readonly params: Readonly<TParams>;

  /** Full match chain. */
  readonly matches: readonly IMatchDescriptor[];

  /** Full `Request` — same instance shared with middleware / guards. */
  readonly request: Request;

  /** Parsed URL — convenience over `new URL(request.url)`. */
  readonly url: URL;
}
