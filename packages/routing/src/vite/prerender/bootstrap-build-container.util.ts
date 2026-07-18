/**
 * @file bootstrap-build-container.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Bootstrap a build-time DI container from the app's
 *   module file (per PLAN v3.9.2 + v3.12.7).
 *
 *   Responsibilities:
 *
 *   1. Set `STACKRA_PLATFORM=build` so `isBuildTime()` from
 *      `@stackra/support` returns `true` — modules that gate on the
 *      platform flag register no-op / mock providers for the walk.
 *   2. Dynamically import the app's DI module (path passed via the
 *      plugin's `moduleFile` option).
 *   3. Dynamically import `@stackra/container`'s `ApplicationFactory`
 *      and call `create(AppModule)`.
 *
 *   Kept dynamic (never a static `import from '@stackra/container'`)
 *   because the plugin ships as a Node-only build tool and the
 *   consumer already installed `@stackra/container` at their app
 *   level — resolving through their `node_modules` gives us the
 *   correct version + provider graph.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

import type { IApplication } from "@stackra/contracts";

/**
 * Bootstrap a build-time DI container.
 *
 * @param moduleFile - Absolute or relative path to the app's DI
 *   module file. When `undefined`, the function returns `null` — the
 *   pipeline runs without a container and pages that need one fail
 *   their loaders soft.
 * @param root       - Base directory for relative resolution.
 * @returns The bootstrapped application, or `null` when no module
 *   file was configured.
 */
export async function bootstrapBuildContainer(
  moduleFile: string | undefined,
  root: string,
): Promise<IApplication | null> {
  if (!moduleFile) return null;

  // Set the build-time flag BEFORE the app module resolves — modules
  // that gate providers on `isBuildTime()` need to see the flag when
  // their `forRoot(...)` runs, not after. `process.env` assignment is
  // deliberate here (build-time plugin context — no `Env` writer
  // helper exists).
  process.env.STACKRA_PLATFORM = "build";

  // Resolve the module path against the Vite root, same as
  // `loadRouterConfig`.
  const absolute = path.isAbsolute(moduleFile) ? moduleFile : path.resolve(root, moduleFile);
  const url = pathToFileURL(absolute).href;

  let module: unknown;
  try {
    module = await import(url);
  } catch (err) {
    throw new Error(
      `[@stackra/routing/vite] Failed to load AppModule from '${absolute}': ${
        (err as Error).message
      }`,
    );
  }

  // The AppModule ships as either the module's `default` export OR a
  // named export whose name ends in `Module`. We prefer `default`,
  // then a single named `*Module`, then fall back to the module
  // record itself (last-resort when the consumer default-exported
  // through a re-export).
  const AppModule = pickAppModuleExport(module);
  if (!AppModule) {
    throw new Error(
      `[@stackra/routing/vite] AppModule at '${absolute}' must be default-exported (or named '*Module').`,
    );
  }

  // Import the container package via the consumer's resolution tree
  // — never through a static import in this file (routing must not
  // hard-link a specific container version at build-tool level).
  let container: unknown;
  try {
    container = await import("@stackra/container");
  } catch (err) {
    throw new Error(
      `[@stackra/routing/vite] Failed to import '@stackra/container' — is it installed at the app level? ${
        (err as Error).message
      }`,
    );
  }

  const factory = (
    container as {
      ApplicationFactory?: { create: (mod: unknown) => Promise<IApplication> };
    }
  ).ApplicationFactory;
  if (!factory || typeof factory.create !== "function") {
    throw new Error(
      `[@stackra/routing/vite] '@stackra/container' does not expose 'ApplicationFactory.create' — installed version is unsupported.`,
    );
  }

  const app = await factory.create(AppModule);
  return app;
}

/**
 * Pick the AppModule class from a dynamically-imported module record.
 *
 * The consumer's convention is to `export default class AppModule`
 * or to ship a single `*Module` named export.
 */
function pickAppModuleExport(module: unknown): unknown {
  const record = module as Record<string, unknown> | null;
  if (!record) return null;

  // Prefer the default export.
  if (record.default) return record.default;

  // Otherwise look for a single named export whose name ends in
  // `Module`. If multiple match, fall back to the module record so
  // the caller can surface a clearer error.
  const moduleNames = Object.keys(record).filter(
    (name) => name !== "default" && name.endsWith("Module"),
  );
  if (moduleNames.length === 1) {
    const chosen = moduleNames[0];
    return chosen ? record[chosen] : null;
  }

  return null;
}
