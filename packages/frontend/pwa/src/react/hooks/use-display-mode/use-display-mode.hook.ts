/**
 * @file use-display-mode.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Display-mode categorisation hook.
 */

import { usePwa } from '@/react/hooks/use-pwa/use-pwa.hook';
import type { PwaDisplayMode } from '@/core/interfaces';

/**
 * The current coarse display-mode categorisation
 * (`'browser'` / `'standalone'` / `'minimal-ui'` / `'fullscreen'` /
 * `'twa'`).
 *
 * @example
 * ```tsx
 * import { useDisplayMode } from '@stackra/pwa/react';
 *
 * function ChromeAffordance() {
 *   const mode = useDisplayMode();
 *   return mode === 'browser' ? <Header /> : null;
 * }
 * ```
 */
export function useDisplayMode(): PwaDisplayMode {
  return usePwa().displayMode;
}
