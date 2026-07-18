/**
 * @file prerender-config.interface.ts
 * @module @stackra/routing/vite/interfaces
 * @description Runtime configuration for `prerenderRoutes(config)`.
 *
 *   The `router()` plugin builds this shape from
 *   `IRouterPluginOptions` before invoking the prerender pipeline
 *   (per PLAN v3.9.2).
 */

/**
 * Runtime configuration for a single prerender walk.
 */
export interface IPrerenderConfig {
  /**
   * Vite root directory (absolute path). Every file path below is
   * resolved against this root when relative.
   */
  readonly root: string;

  /**
   * Absolute or relative path to `react-router.config.ts`. When
   * relative, resolved against {@link root}.
   */
  readonly configFile: string;

  /**
   * Absolute or relative path to the app's DI module. When omitted,
   * the pipeline runs without a container — pages that need one
   * fail their loaders soft.
   */
  readonly moduleFile?: string;

  /**
   * Absolute path to the output directory (Vite `outDir`, augmented
   * with the plugin's `prerender.outputDir` when set).
   */
  readonly outputDir: string;

  /**
   * Base URL under which the app is deployed. Absolute canonical /
   * OpenGraph URLs use it; also inserted into the runtime `<base>`
   * tag when set.
   *
   * @default '/'
   */
  readonly baseUrl?: string;

  /**
   * Names of the client entry chunks Vite emitted (`.js` files under
   * `outDir`). The HTML shell references them so the hydrated SPA
   * takes over after the prerendered content lands. Values are paths
   * relative to `outputDir`.
   *
   * @default []
   */
  readonly clientEntries?: readonly string[];

  /**
   * Names of the CSS chunks Vite emitted. Same convention as
   * {@link clientEntries}.
   *
   * @default []
   */
  readonly clientStyles?: readonly string[];
}
