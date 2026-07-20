/**
 * @file prerender-context.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Build-time context passed to a page's `prerender(...)`
 *   function. Distinct from `IPageContext` — no `data`, no `request`,
 *   no `url` (build time has no HTTP request).
 */

import type { IApplication } from "../container";

/**
 * Context object passed to `definePage({prerender: (ctx) => ...})`.
 *
 * Prerender runs at build time — the only useful field is the DI
 * container so functions can resolve services (CMS, DB) to fetch
 * the param bags to prerender.
 */
export interface IPrerenderContext {
  /**
   * DI container running the build-time module tree. Prerender
   * functions can use it to resolve CMS / API / DB services.
   */
  readonly container: IApplication;
}
