/**
 * @file merge-config.util.ts
 * @module @stackra/notifications/core/utils
 * @description Merge user-supplied notification options with
 *   `DEFAULT_NOTIFICATIONS_CONFIG`.
 *
 *   The single choke point for defaults application. `centre` is
 *   merged one level deep so a partial user override
 *   (`{ centre: { maxItems: 500 } }`) keeps the sibling defaults
 *   (`storageKey`, `storage`) intact. `push` is left as-is (the
 *   caller either supplies the full shape or leaves it out entirely
 *   — a partial `push` config would be missing the required
 *   `vapidPublicKey`).
 */

import { DEFAULT_NOTIFICATIONS_CONFIG } from '../constants/defaults.constant';
import type { INotificationModuleOptions } from '../interfaces';

/**
 * Merge user options over {@link DEFAULT_NOTIFICATIONS_CONFIG}.
 *
 * @param options - Optional partial user options.
 * @returns Fully-resolved configuration with every default applied.
 */
export function mergeConfig(options?: INotificationModuleOptions): INotificationModuleOptions {
  const opts = options ?? {};
  return {
    // `centre` merges one level deep so a partial override keeps
    // the sibling defaults (`storageKey`, `maxItems`, ...).
    centre: {
      ...DEFAULT_NOTIFICATIONS_CONFIG.centre,
      ...opts.centre,
    },
    // `push` is required-in-full or omitted — no partial defaults.
    // Preserve the caller's `push` block verbatim when supplied.
    ...(opts.push ? { push: opts.push } : {}),
    // `defaultStack` is a flat readonly array — spread when supplied,
    // fall back to the default otherwise.
    defaultStack: opts.defaultStack ?? DEFAULT_NOTIFICATIONS_CONFIG.defaultStack,
  };
}
