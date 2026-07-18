/**
 * @file matcher-context.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Runtime context passed to every route matcher — advanced
 *   matchers (`subdomain`, `query`, `header`, `hash`, `custom`) receive
 *   this exact shape.
 */

import type { IApplication } from "../container";

/**
 * Context object shared by every route matcher. One consistent shape so
 * matcher callbacks destructure only what they need.
 */
export interface IMatcherContext {
  /** Parsed subdomain (`'admin'`) or `null` for apex domain. */
  readonly subdomain: string | null;

  /** Full hostname (`'admin.example.com'`). */
  readonly hostname: string;

  /** Pathname (`'/users/42'`). */
  readonly path: string;

  /** Parsed query string. */
  readonly query: URLSearchParams;

  /** Request headers. */
  readonly headers: Headers;

  /** URL hash (without the leading `#`). */
  readonly hash: string;

  /** Path params matched so far by the parent match chain. */
  readonly params: Readonly<Record<string, string>>;

  /** Full `Request` — escape hatch for anything not exposed above. */
  readonly request: Request;

  /** Parsed URL — convenience over `new URL(request.url)`. */
  readonly url: URL;

  /**
   * DI container — tenant lookups, feature flags, etc. Anything the
   * custom matcher needs to resolve through the framework.
   */
  readonly container: IApplication;
}
