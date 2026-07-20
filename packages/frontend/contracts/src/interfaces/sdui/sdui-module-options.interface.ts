/**
 * @file sdui-module-options.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Consumer configuration for `SduiModule.forRoot(...)`.
 */

import type { ISduiComponentEntry, ISduiLayoutEntry } from "./sdui-registry.interface";

/**
 * Configuration options for the SDUI module.
 */
export interface ISduiModuleOptions {
  /** Base URL for schema fetches. */
  readonly baseUrl?: string;

  /**
   * Cache TTL for fetched screens, in seconds. Defaults to one hour.
   * Set `0` to disable caching entirely.
   */
  readonly cacheTtl?: number;

  /**
   * When `true`, the renderer runs the screen validator against every
   * loaded screen. Defaults to `false` in production.
   */
  readonly validateSchemas?: boolean;

  /**
   * Additional components registered at boot alongside the core seed
   * (Box/Stack/Grid/Section/Text/Heading/Icon + HeroUI compounds).
   */
  readonly components?: Readonly<Record<string, ISduiComponentEntry>>;

  /** Additional layout templates registered at boot. */
  readonly layouts?: readonly ISduiLayoutEntry[];
}
