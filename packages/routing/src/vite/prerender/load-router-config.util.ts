/**
 * @file load-router-config.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Dynamic-import loader for the app's
 *   `react-router.config.ts` at build time.
 *
 *   The plugin only knows the config's PATH — it can't statically
 *   import the file (that would force every consumer app to ship with
 *   the exact same file layout). We import at build time via
 *   `import(...)` and validate the shape by looking for a default
 *   export that has a `routes` array.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

import type { IRouterConfig } from "@stackra/contracts";

/**
 * Load and validate the router config from a filesystem path.
 *
 * @param configPath - Absolute or relative path to the config file.
 *   Relative paths are resolved against {@link root}.
 * @param root       - Base directory for relative resolution.
 * @returns The router config default-exported by the file.
 * @throws Error when the file cannot be imported or when the default
 *   export doesn't shape-match `IRouterConfig`.
 */
export async function loadRouterConfig(configPath: string, root: string): Promise<IRouterConfig> {
  // Resolve to an absolute path first — `import(...)` on Node
  // accepts URL-like strings only, and a bare relative path would be
  // resolved against the current module rather than the caller's
  // Vite root.
  const absolute = path.isAbsolute(configPath) ? configPath : path.resolve(root, configPath);

  // `pathToFileURL` gives us the `file://` protocol string Node's ESM
  // loader expects. This works uniformly for both `.ts` (Vite's
  // ssrLoadModule-based imports handle transpilation upstream) and
  // `.mjs` on-disk files.
  const url = pathToFileURL(absolute).href;

  let module: unknown;
  try {
    module = await import(url);
  } catch (err) {
    // Wrap so the plugin can present a stable error message to Vite
    // — the raw ESM loader error is not always informative.
    throw new Error(
      `[@stackra/routing/vite] Failed to load router config from '${absolute}': ${
        (err as Error).message
      }`,
    );
  }

  const candidate = (module as { default?: IRouterConfig }).default;
  if (!candidate || !Array.isArray((candidate as IRouterConfig).routes)) {
    throw new Error(
      `[@stackra/routing/vite] Router config at '${absolute}' must default-export a value with a 'routes' array. ` +
        `Use \`export default defineRouterConfig({routes})\`.`,
    );
  }

  return candidate;
}
