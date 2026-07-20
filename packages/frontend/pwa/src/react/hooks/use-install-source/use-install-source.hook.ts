/**
 * @file use-install-source.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Aggregate install-source attribution hook.
 */

import { usePwa } from "@/react/hooks/use-pwa/use-pwa.hook";
import type { IPwaAttribution } from "@/core/interfaces";

/**
 * Full install-source attribution snapshot — UTM + display mode +
 * referrer + a derived `isInstalledContext` boolean.
 *
 * @example
 * ```tsx
 * import { useInstallSource } from '@stackra/pwa/react';
 *
 * function InstallSourceTag() {
 *   const source = useInstallSource();
 *   analytics.track('first_open', {
 *     utm: source.utm,
 *     display_mode: source.displayMode,
 *     referrer: source.referrer,
 *   });
 * }
 * ```
 */
export function useInstallSource(): IPwaAttribution {
  return usePwa().attribution;
}
