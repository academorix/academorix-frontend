/**
 * @file resolve-plugins.util.ts
 * @module @stackra/vite/core/utils
 * @description Walks a plugin map, invokes each enabled entry's
 *   `factory(options)`, and flattens the results into a `Plugin[]`
 *   array. Preserves insertion order. Throws
 *   {@link PluginResolutionError} when a factory throws.
 */

import type { Plugin } from "vite";
import type { IPluginMap } from "../interfaces/plugin-map.interface";
import { PluginResolutionError } from "../errors/plugin-resolution.error";

// ════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Resolve an {@link IPluginMap} into an ordered `Plugin[]` array.
 *
 * Walks the map in insertion order, invokes every entry whose
 * `enabled === true` with its `options`, awaits the result, and
 * flattens single plugins + plugin arrays into one flat list.
 *
 * Insertion order is preserved because plugin ordering is
 * semantically significant to Vite (e.g. `@vitejs/plugin-react`
 * must run before `vite-tsconfig-paths`).
 *
 * @param map - The plugin map to resolve. When `undefined`, returns
 *   an empty array.
 * @returns A promise resolving to the ordered plugin array. Empty
 *   when the map is `undefined` or contains no enabled entries.
 * @throws {@link PluginResolutionError} When a plugin factory
 *   throws — the original exception is preserved on the `cause`
 *   field and the offending plugin's key is named in the message.
 *
 * @example
 * ```typescript
 * import react from '@vitejs/plugin-react-swc';
 * import { resolvePlugins } from '@stackra/vite';
 *
 * const plugins = await resolvePlugins({
 *   react: { enabled: true, factory: react, options: {} },
 * });
 * ```
 */
export async function resolvePlugins(map?: IPluginMap): Promise<Plugin[]> {
  // Nothing to resolve — bail early with an empty array so callers
  // can pass `options.plugins` (which may be `undefined`) through
  // without a nullish guard.
  if (!map) return [];

  const out: Plugin[] = [];

  // `Object.entries` on an object keeps the insertion order per
  // the JavaScript spec (with the standard caveat that
  // integer-string keys sort numerically — which we don't use).
  for (const [name, entry] of Object.entries(map)) {
    // Disabled entries are the whole reason this envelope exists —
    // skip them entirely so the factory is never invoked.
    if (!entry.enabled) continue;

    try {
      // `factory(...)` may be sync or async, and may return a
      // single `Plugin` or a `Plugin[]`. Await once and normalise
      // the two shapes into a flat push.
      const result = await entry.factory(entry.options);

      if (Array.isArray(result)) {
        out.push(...result);
      } else {
        out.push(result);
      }
    } catch (cause) {
      // Wrap the underlying error so callers get a stable
      // `PluginResolutionError` code + a message that names the
      // offending plugin. The original exception is preserved on
      // `cause` for debugging.
      const causeError = cause instanceof Error ? cause : new Error(String(cause));
      throw new PluginResolutionError(
        `Plugin "${name}" factory threw: ${causeError.message}`,
        causeError,
      );
    }
  }

  return out;
}
