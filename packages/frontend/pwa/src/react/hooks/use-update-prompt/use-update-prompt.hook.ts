/**
 * @file use-update-prompt.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Service-worker update prompt hook.
 */

import { useCallback } from 'react';
import { useInject } from '@stackra/container/react';

import { PWA_SERVICE } from '@/core/constants';
import type { PwaService } from '@/core/services';
import { usePwa } from '@/react/hooks/use-pwa/use-pwa.hook';
import type { IUseUpdatePromptResult } from './use-update-prompt.interface';

/**
 * Access service-worker update state + actions.
 *
 * @example
 * ```tsx
 * import { useUpdatePrompt } from '@stackra/pwa/react';
 *
 * function UpdateCta() {
 *   const { isVisible, accept, dismiss } = useUpdatePrompt();
 *   if (!isVisible) return null;
 *   return (
 *     <div>
 *       New version available.
 *       <button onClick={accept}>Refresh</button>
 *       <button onClick={dismiss}>Later</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUpdatePrompt(): IUseUpdatePromptResult {
  const { update } = usePwa();
  const service = useInject<PwaService>(PWA_SERVICE);

  const accept = useCallback(() => service.acceptUpdate(), [service]);
  const dismiss = useCallback(() => service.dismissUpdate(), [service]);

  return { ...update, accept, dismiss };
}
