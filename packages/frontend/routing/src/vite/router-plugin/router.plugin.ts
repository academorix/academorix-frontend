/**
 * @file router.plugin.ts
 * @module @stackra/routing/vite/router-plugin
 * @description The `router()` Vite plugin factory (per PLAN v3.3 +
 *   v3.9.2).
 *
 *   Responsibilities:
 *
 *   1. `config()` — patch the dev server so `*.localhost` subdomains
 *      resolve (`server.host = '0.0.0.0'` + `allowedHosts` includes
 *      the configured root domain).
 *   2. `configureServer()` — inject the dev-subdomain middleware +
 *      print the startup banner.
 *   3. `resolveId()` + `load()` — expose the `virtual:stackra-
 *      routing/dev-subdomain` module so the runtime can read the
 *      parsed subdomain when `?_subdomain=` overrides land.
 *   4. `buildStart()` — set `STACKRA_PLATFORM=build` so the DI
 *      container's build-time guards (`isBuildTime()`) fire during
 *      the prerender walk.
 *   5. `closeBundle()` — run the prerender pipeline against the
 *      completed bundle and write outputs to disk.
 *
 *   The plugin is fail-soft on prerender — build-time errors are
 *   logged (via Vite's `logger.error`) but don't abort the whole
 *   build unless the `page.prerender` function itself throws.
 */

import path from "node:path";

import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

import { printStartupBanner } from "../banner";
import type { IRouterPluginOptions } from "../interfaces";
import { prerenderRoutes } from "../prerender";
import { writePrerenderOutput } from "../prerender/write-output.util";
import {
  createDevSubdomainMiddleware,
  RESOLVED_DEV_SUBDOMAIN_ID,
  VIRTUAL_DEV_SUBDOMAIN_ID,
  buildDevSubdomainModuleSource,
} from "../subdomain";

/**
 * Create the `router()` Vite plugin.
 *
 * @param options - Plugin configuration.
 * @returns A single Vite `Plugin` — mount it once in `plugins: [...]`.
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { router } from '@stackra/routing/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     router({
 *       rootDomain: 'stackra.app',
 *       devMode: 'localhost',
 *       devSubdomains: ['admin', 'ops'],
 *       moduleFile: 'src/app.module.ts',
 *     }),
 *   ],
 * });
 * ```
 */
export function router(options: IRouterPluginOptions = {}): Plugin {
  const {
    rootDomain,
    devMode = "localhost",
    devSubdomains = [],
    allowDevSubdomainQuery = false,
    configFile = "./react-router.config.ts",
    moduleFile,
    prerender: prerenderOptions,
  } = options;

  // Track the resolved Vite config so `closeBundle` can compute the
  // absolute output directory + honour the project's `base`.
  let resolvedConfig: ResolvedConfig | null = null;

  const prerenderEnabled = prerenderOptions?.enabled !== false;

  return {
    name: "@stackra/routing:router",

    // ── Vite lifecycle hooks ────────────────────────────────────

    /**
     * Patch dev-server + client env before Vite starts.
     */
    config(config, envArgs) {
      // Only mutate the server config in `serve` mode — production
      // builds don't spin up a dev server and touching `server`
      // there would be a no-op noise line.
      if (envArgs.command === "serve") {
        // `host: '0.0.0.0'` lets external / cross-device browsers
        // reach the dev server (needed for the LAN-shared workflow).
        const server = { ...(config.server ?? {}) };
        server.host = server.host ?? "0.0.0.0";

        // `allowedHosts` protects against Host-header attacks in
        // dev. Prepend `.localhost` so every `*.localhost` request
        // resolves; append the root domain (both apex + wildcard)
        // when set.
        const existingHosts = normaliseAllowedHosts(server.allowedHosts);
        const extra = [".localhost"];
        if (rootDomain) {
          extra.push(rootDomain, `.${rootDomain}`);
        }
        // Filter existing hosts against the extras via a `Set` so we
        // don't append duplicates when the consumer already listed
        // one.
        const dedupe = new Set<string>([...existingHosts, ...extra]);
        server.allowedHosts = Array.from(dedupe);

        config.server = server;
      }

      // Set `STACKRA_PLATFORM=client` for both dev + production
      // client builds — modules that gate on the platform flag see
      // the runtime channel. The prerender walk overrides this to
      // `build` in `buildStart` right before scanning routes.
      Object.assign(process.env, {
        ...process.env,
        STACKRA_PLATFORM: process.env.STACKRA_PLATFORM ?? "client",
      });

      return undefined;
    },

    /**
     * Capture the resolved config — used later by `closeBundle` to
     * compute the absolute output directory.
     */
    configResolved(config): void {
      resolvedConfig = config;
    },

    /**
     * Inject the dev-subdomain middleware + print the startup banner.
     */
    configureServer(server: ViteDevServer): () => void {
      // The middleware injection returns a "post" hook — Vite calls
      // it after its built-in middleware, which is what we want:
      // Vite's HMR / static-file middleware runs first, our subdomain
      // parsing lands right before the route resolves.
      return (): void => {
        server.middlewares.use(
          createDevSubdomainMiddleware({
            rootDomain,
            allowDevSubdomainQuery,
          }),
        );

        // The banner fires ONCE when the dev server binds. We read
        // the resolved port so the printed URLs match what the
        // consumer sees in Vite's own banner.
        const port = server.config.server.port ?? 5173;
        printStartupBanner({
          rootDomain,
          devSubdomains,
          devMode,
          port,
        });
      };
    },

    /**
     * Recognise the dev-subdomain virtual module id.
     */
    resolveId(id: string): string | null {
      if (id === VIRTUAL_DEV_SUBDOMAIN_ID) return RESOLVED_DEV_SUBDOMAIN_ID;
      return null;
    },

    /**
     * Serve the source of the dev-subdomain virtual module.
     */
    load(id: string): string | null {
      if (id === RESOLVED_DEV_SUBDOMAIN_ID) return buildDevSubdomainModuleSource();
      return null;
    },

    /**
     * Flip `STACKRA_PLATFORM` to `build` before any code loads for
     * the prerender pass. Modules that guard on `isBuildTime()`
     * register no-op providers in this window.
     */
    buildStart(): void {
      if (prerenderEnabled) {
        process.env.STACKRA_PLATFORM = "build";
      }
    },

    /**
     * After Vite finishes the bundle, run the prerender pipeline +
     * write outputs to disk.
     *
     * Fail-soft: individual render / loader failures are logged to
     * Vite's logger; the build itself never fails unless the
     * pipeline's config load / DI bootstrap throws.
     */
    async closeBundle(): Promise<void> {
      if (!prerenderEnabled) return;
      if (!resolvedConfig) return;

      const outputDir = computeOutputDir({
        root: resolvedConfig.root,
        buildOutDir: resolvedConfig.build?.outDir ?? "dist",
        pluginOutputDir: prerenderOptions?.outputDir,
      });

      const logger = resolvedConfig.logger;

      try {
        const result = await prerenderRoutes({
          root: resolvedConfig.root,
          configFile,
          moduleFile,
          outputDir,
          baseUrl: resolvedConfig.base,
        });

        // Write every successful output. `writePrerenderOutput`
        // handles directory creation.
        for (const output of result.outputs) {
          try {
            const written = await writePrerenderOutput(output, outputDir);
            logger.info(`[@stackra/routing] prerender → ${written}`);
          } catch (err) {
            logger.error(
              `[@stackra/routing] Failed to write prerender output for ` +
                `'${output.path}': ${(err as Error).message}`,
            );
          }
        }

        // Report render / loader failures.
        for (const error of result.errors) {
          logger.error(
            `[@stackra/routing] prerender error at '${error.path}' ` +
              `(subdomain='${error.subdomain ?? "apex"}'): ${error.error.message}`,
          );
        }
      } catch (err) {
        // A top-level throw here means the config file / DI module
        // couldn't load — abort with a clear message. This IS a hard
        // error per PLAN v3.9.2.
        logger.error(`[@stackra/routing] Prerender aborted: ${(err as Error).message}`);
        throw err;
      } finally {
        // Restore the platform flag so any post-build tooling sees
        // the runtime channel again.
        process.env.STACKRA_PLATFORM = "client";
      }
    },
  };
}

// ── Internal ────────────────────────────────────────────────────────

/**
 * Compute the absolute output directory for prerendered HTML.
 */
function computeOutputDir(input: {
  readonly root: string;
  readonly buildOutDir: string;
  readonly pluginOutputDir: string | undefined;
}): string {
  const { root, buildOutDir, pluginOutputDir } = input;

  // Base = Vite's build outDir (usually `dist`).
  const base = path.isAbsolute(buildOutDir) ? buildOutDir : path.resolve(root, buildOutDir);

  // Optionally nest under the plugin's `outputDir`. Consumers who
  // want prerendered pages in a sibling directory (e.g. `dist/static`)
  // use this.
  if (!pluginOutputDir) return base;
  return path.isAbsolute(pluginOutputDir) ? pluginOutputDir : path.resolve(base, pluginOutputDir);
}

/**
 * Vite's `allowedHosts` is either `boolean | string[]`. Normalise to
 * a string array — `true` (allow all) becomes an empty list so the
 * plugin's explicit list wins.
 */
function normaliseAllowedHosts(value: true | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return [];
}
