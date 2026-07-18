/**
 * @file use-pwa.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Aggregate PWA state hook — subscribes to the DI
 *   `PwaService` via `useSyncExternalStore`.
 *
 *   Every specialised hook (`useInstallPrompt`, `useUpdatePrompt`,
 *   `useStandaloneMode`, `useDisplayMode`) builds on top of this one
 *   by slicing off a specific facet of the snapshot.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { useInject } from '@stackra/container/react';

import { PWA_SERVICE } from '@/core/constants';
import type { PwaService } from '@/core/services';
import type { IUsePwaResult } from './use-pwa.interface';

/**
 * Aggregate PWA snapshot hook.
 *
 * @example
 * ```tsx
 * import { usePwa } from '@stackra/pwa/react';
 *
 * function PwaDebug() {
 *   const { install, update, displayMode } = usePwa();
 *   return (
 *     <ul>
 *       <li>Installable: {String(install.isSupported)}</li>
 *       <li>Update ready: {String(update.isAvailable)}</li>
 *       <li>Display: {displayMode}</li>
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePwa(): IUsePwaResult {
  const service = useInject<PwaService>(PWA_SERVICE);

  // useSyncExternalStore requires stable identity for both callbacks —
  // useCallback bound to the resolved singleton service.
  const subscribe = useCallback((cb: () => void) => service.subscribe(cb), [service]);
  const getSnapshot = useCallback(() => service.getSnapshot(), [service]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    install: snapshot.install,
    update: snapshot.update,
    standalone: snapshot.standalone,
    displayMode: snapshot.displayMode,
    attribution: snapshot.attribution,
  };
}
