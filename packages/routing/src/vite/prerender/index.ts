/**
 * @file index.ts
 * @module @stackra/routing/vite/prerender
 * @description Public API barrel for the `prerender/` category.
 */

export { loadRouterConfig } from "./load-router-config.util";
export { bootstrapBuildContainer } from "./bootstrap-build-container.util";
export { walkRoutes, type IWalkedRoute } from "./walk-routes.util";
export { evaluateLazyRoute, type IEvaluatedRouteModule } from "./evaluate-lazy-route.util";
export { renderPrerender, resolveRoutePath } from "./render-prerender.util";
export {
  buildHtmlShell,
  NONCE_PLACEHOLDER,
  type IBuildHtmlShellInput,
} from "./build-html-shell.util";
export { computeOutputFilePath, writePrerenderOutput } from "./write-output.util";
export { prerenderRoutes } from "./prerender-routes.util";
