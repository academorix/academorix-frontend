/**
 * @file use-install-prompt.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Install-prompt state + actions hook.
 *
 *   Slices the install substate off `PwaService.getSnapshot()` and
 *   surfaces the `promptInstall` / `dismiss` / `reset` methods.
 */

import { useCallback } from 'react';
import { useInject } from '@stackra/container/react';

import { PWA_SERVICE } from '@/core/constants';
import type { PwaService } from '@/core/services';
import { usePwa } from '@/react/hooks/use-pwa/use-pwa.hook';
import type { IUseInstallPromptResult } from './use-install-prompt.interface';

/**
 * Access install-prompt state and actions.
 *
 * @example
 * ```tsx
 * import { useInstallPrompt } from '@stackra/pwa/react';
 * import { Button } from '@stackra/ui/react';
 *
 * function InstallCta() {
 *   const { isSupported, isVisible, isInstalled, promptInstall, dismiss } = useInstallPrompt();
 *   if (!isVisible || isInstalled) return null;
 *   return (
 *     <div className="flex gap-2">
 *       <Button onPress={() => promptInstall()} isDisabled={!isSupported}>Install</Button>
 *       <Button variant="ghost" onPress={dismiss}>Not now</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useInstallPrompt(): IUseInstallPromptResult {
  const { install } = usePwa();
  const service = useInject<PwaService>(PWA_SERVICE);

  const promptInstall = useCallback(() => service.promptInstall(), [service]);
  const dismiss = useCallback(() => service.dismissInstallPrompt(), [service]);
  const reset = useCallback(() => service.resetDismissCount(), [service]);

  return { ...install, promptInstall, dismiss, reset };
}
