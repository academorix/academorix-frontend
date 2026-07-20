/**
 * @file use-standalone-mode.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Boolean hook — is the app running as an installed PWA?
 */

import { usePwa } from "@/react/hooks/use-pwa/use-pwa.hook";

/**
 * Whether the app is running as an installed PWA (standalone or TWA).
 *
 * @example
 * ```tsx
 * import { useStandaloneMode } from '@stackra/pwa/react';
 *
 * function OnlyInApp() {
 *   const standalone = useStandaloneMode();
 *   if (!standalone) return <BrowserBanner />;
 *   return <MainNav />;
 * }
 * ```
 */
export function useStandaloneMode(): boolean {
  return usePwa().standalone;
}
