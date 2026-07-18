/**
 * @file index.ts
 * @module @stackra/routing/vite/interfaces
 * @description Public API barrel for the `interfaces/` category.
 */

export type {
  IRouterPluginOptions,
  IRouterPluginPrerenderOptions,
} from "./router-plugin-options.interface";
export type { IPrerenderConfig } from "./prerender-config.interface";
export type {
  IPrerenderError,
  IPrerenderOutput,
  IPrerenderResult,
} from "./prerender-result.interface";
