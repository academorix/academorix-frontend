/**
 * @file index.ts
 * @module @stackra/routing/vite/subdomain
 * @description Public API barrel for the `subdomain/` category.
 */

export { parseSubdomain } from "./parse-subdomain.util";
export {
  createDevSubdomainMiddleware,
  type DevMiddleware,
  type IDevSubdomainMiddlewareOptions,
} from "./dev-subdomain-middleware.util";
export {
  VIRTUAL_DEV_SUBDOMAIN_ID,
  RESOLVED_DEV_SUBDOMAIN_ID,
  buildDevSubdomainModuleSource,
} from "./virtual-module.util";
