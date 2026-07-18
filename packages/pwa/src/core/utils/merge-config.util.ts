/**
 * @file merge-config.util.ts
 * @module @stackra/pwa/core/utils
 * @description Merge user-supplied PWA options with `DEFAULT_PWA_CONFIG`.
 *
 *   The single choke point for defaults application — both `forRoot`
 *   and `forRootAsync` route through it so the resolved config is
 *   always structurally uniform.
 */

import { DEFAULT_PWA_CONFIG } from '../constants/defaults.constant';
import type { IPwaModuleOptions } from '../interfaces';

/**
 * Merge user options over {@link DEFAULT_PWA_CONFIG}.
 *
 * Merges are shallow at the top level and one level deep for the
 * nested config sections (`install`, `update`) so a partial user
 * override doesn't erase sibling defaults.
 *
 * @param options - Optional partial user options.
 * @returns Fully-resolved configuration with every default applied.
 */
export function mergeConfig(options?: IPwaModuleOptions): IPwaModuleOptions {
  const opts = options ?? {};
  // Merge each nested section explicitly so a partial user override
  // (e.g. `install: { delayMs: 15000 }`) keeps the sibling defaults
  // (`dismissKey`, `maxDismissals`) intact.
  return {
    install: { ...DEFAULT_PWA_CONFIG.install, ...opts.install },
    update: { ...DEFAULT_PWA_CONFIG.update, ...opts.update },
    autoRequestPersistent: opts.autoRequestPersistent ?? DEFAULT_PWA_CONFIG.autoRequestPersistent,
  };
}
