/**
 * @file merge-config.util.ts
 * @module @stackra/routing/core/utils
 * @description Single source of truth for merging user options with
 *   `DEFAULT_ROUTING_CONFIG`. Both `forRoot` and `forRootAsync` route
 *   through this helper so defaults stay consistent.
 *
 *   The merge normalises the `devSubdomains` list (dedupe, lowercase,
 *   drop empties) so the runtime never has to re-clean it.
 */

import { Str } from "@stackra/support";
import type { IRoutingModuleOptions } from "@stackra/contracts";

import { DEFAULT_ROUTING_CONFIG } from "@/core/constants";

/**
 * Merge user options with `DEFAULT_ROUTING_CONFIG` and normalise
 * commonly-messy fields.
 *
 * Normalisation:
 * - `devSubdomains` — trimmed, lowercased, empties dropped, deduped.
 * - `prerender` — shallow-merged so a partial user object (e.g.
 *   `{outputDir: 'build'}`) keeps the default `enabled: true`.
 *
 * @param options - User-supplied partial options.
 * @returns Resolved options with defaults applied and fields normalised.
 */
export function mergeConfig(options?: Partial<IRoutingModuleOptions>): IRoutingModuleOptions {
  // Layer the user options on top of the defaults. Undefined user
  // fields fall back to the default; explicit user values win.
  const merged: IRoutingModuleOptions = {
    ...DEFAULT_ROUTING_CONFIG,
    ...(options ?? {}),
  };

  // Normalise the dev-subdomain list — the runtime uses this list for
  // banner + subdomain-alias matching, and would otherwise have to
  // repeat the cleanup at every read.
  const devSubdomains = Array.from(
    new Set(
      (merged.devSubdomains ?? [])
        .map((name) => Str.lower(Str.trim(name)))
        .filter((name) => name.length > 0),
    ),
  );

  // Shallow-merge `prerender` so a partial user override keeps the
  // untouched defaults intact.
  const prerender = {
    ...DEFAULT_ROUTING_CONFIG.prerender,
    ...(options?.prerender ?? {}),
  };

  return {
    ...merged,
    devSubdomains,
    prerender,
  };
}
