/**
 * @file use-web-share.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Wrapper around `navigator.share` — the OS share sheet.
 */

import { useCallback, useMemo } from 'react';

import type { IUseWebShareResult, IWebShareData } from './use-web-share.interface';

/**
 * Web Share API hook.
 *
 * @example
 * ```tsx
 * import { useWebShare } from '@stackra/pwa/react';
 * import { Button } from '@stackra/ui/react';
 *
 * function ShareButton() {
 *   const { isSupported, share } = useWebShare();
 *   if (!isSupported) return null;
 *   return (
 *     <Button onPress={() => share({ title: 'Stackra', url: window.location.href })}>
 *       Share
 *     </Button>
 *   );
 * }
 * ```
 */
export function useWebShare(): IUseWebShareResult {
  // `isSupported` is memoised because `navigator.share` is a stable
  // reference for the lifetime of the tab.
  const isSupported = useMemo(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    []
  );

  const share = useCallback(
    async (data: IWebShareData): Promise<boolean> => {
      if (!isSupported) return false;
      try {
        // Cast to `ShareData` — the standard lib types cover it.
        await navigator.share(data as ShareData);
        return true;
      } catch {
        // fail-soft — user cancel is thrown as AbortError. Return
        // `false` uniformly so callers don't need to inspect the
        // error kind.
        return false;
      }
    },
    [isSupported]
  );

  return { isSupported, share };
}
