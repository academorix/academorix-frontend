/**
 * @file use-sdui-page.hook.ts
 * @module @stackra/sdui/react/hooks
 * @description `useSduiPage(path)` — resolve a page descriptor from the
 *   DI-managed {@link SduiPageRegistry}.
 */

import { useOptionalInject } from '@stackra/container/react';
import type { ISduiPageDescriptor } from '@stackra/contracts';
import { SDUI_PAGE_REGISTRY } from '@stackra/contracts';
import type { SduiPageRegistry } from '@/core/registries/sdui-page.registry';

/**
 * Resolve a page descriptor by URL path.
 *
 * Returns `undefined` when no page is registered under `path` OR when
 * `SduiModule` isn't wired (the registry binding is absent). Consumers
 * typically pair this with `<SduiScreenView>` to render the page's
 * screen when found and delegate to the app's regular router
 * otherwise.
 *
 * @param path - Normalized URL path (`/orders`, `/orders/:id`, …).
 * @returns The page descriptor, or `undefined` when no match.
 *
 * @example
 * ```tsx
 * import { useSduiPage } from '@stackra/sdui/react';
 *
 * function SduiSlot({ pathname }: { pathname: string }) {
 *   const page = useSduiPage(pathname);
 *   return page ? <SduiScreenView screen={page.screen} /> : null;
 * }
 * ```
 */
export function useSduiPage(path: string): ISduiPageDescriptor | undefined {
  // Optional inject — SDUI may not be wired in every app (headless
  // CLIs, tests). Returning `undefined` in that case is the caller's
  // signal to fall back to their own routing.
  const registry = useOptionalInject<SduiPageRegistry>(SDUI_PAGE_REGISTRY);
  return registry?.resolve(path);
}
