/**
 * @file detect-standalone.util.ts
 * @module @stackra/pwa/core/utils
 * @description SSR-safe helper to detect whether the app is running
 *   as an installed PWA (standalone or TWA display mode).
 */

import { detectDisplayMode } from './detect-display-mode.util';

/**
 * Returns `true` when the current display mode is one of the
 * "installed app" contexts.
 *
 * Wraps {@link detectDisplayMode} so consumers that only need the
 * boolean stay concise.
 */
export function detectStandalone(): boolean {
  const mode = detectDisplayMode();
  return mode === 'standalone' || mode === 'twa' || mode === 'fullscreen';
}
