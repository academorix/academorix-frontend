/**
 * @file use-direction.hook.ts
 * @module @stackra/i18n/react/hooks
 * @description Hook for accessing text direction state.
 *   Returns the current direction, RTL flag, and locale.
 *
 *   Uses `useInject()` from `@stackra/container/react` for proper DI access.
 *
 *   ## Usage
 *
 *   ```typescript
 *   function MyComponent() {
 *     const { dir, isRTL } = useDirection();
 *     return <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>...</View>;
 *   }
 *   ```
 */

import { useInject } from '@stackra/container/react';
import { I18N_LOCALE_SERVICE } from '@stackra/contracts';

import type { I18nLocaleService } from '../services/i18n-locale.service';
import type { UseDirectionReturn } from '../interfaces';

/**
 * Access the current text direction from a React component.
 *
 * Lighter than `useI18n()` — use when you only need direction info
 * for layout decisions (flex direction, margin side, icon flip).
 *
 * @returns Direction state
 *
 * @example
 * ```typescript
 * function Header() {
 *   const { dir, isRTL } = useDirection();
 *   return (
 *     <header dir={dir}>
 *       <Icon name={isRTL ? 'arrow-left' : 'arrow-right'} />
 *     </header>
 *   );
 * }
 * ```
 */
export function useDirection(): UseDirectionReturn {
  const localeService = useInject<I18nLocaleService>(I18N_LOCALE_SERVICE);

  return {
    dir: localeService.getDir(),
    isRTL: localeService.isRTL(),
    locale: localeService.getLocale(),
  };
}
