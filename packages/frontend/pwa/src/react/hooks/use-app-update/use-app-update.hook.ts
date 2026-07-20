/**
 * @file use-app-update.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description React hook — reactive access to
 *   {@link AppUpdateService}'s state.
 *
 *   Backed by `useSyncExternalStore` for tearing-free reads under
 *   concurrent React. Requires `PwaModule.forRoot({ appUpdate: ... })`
 *   to be called at module setup — otherwise `useInject` throws.
 */

import { useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";

import { APP_UPDATE_SERVICE } from "@/core/constants";
import type { AppUpdateService } from "@/core/services";

import type { IUseAppUpdateResult } from "./use-app-update.interface";

/**
 * Access reactive app-update state.
 *
 * @example
 * ```tsx
 * import { useAppUpdate } from '@stackra/pwa/react';
 *
 * function UpdateCta() {
 *   const { hasUpdate, latest, mandatory, accept, dismiss } = useAppUpdate();
 *   if (!hasUpdate) return null;
 *   return (
 *     <div>
 *       Version {latest} is out{mandatory ? ' (required)' : ''}.
 *       <button onClick={() => accept()}>Update now</button>
 *       {!mandatory && <button onClick={dismiss}>Later</button>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @throws When `PwaModule.forRoot` was called WITHOUT an
 *   `appUpdate` config slice. The service isn't bound in that case
 *   and `useInject` reports the missing provider.
 */
export function useAppUpdate(): IUseAppUpdateResult {
  const service = useInject<AppUpdateService>(APP_UPDATE_SERVICE);

  // useSyncExternalStore expects stable references — the service
  // exposes a stable `subscribe` and its `getState` returns a new
  // frozen snapshot on every internal mutation.
  const state = useSyncExternalStore(
    (listener) => service.subscribe(listener),
    () => service.getState(),
    // SSR getSnapshot — safe on server, no listeners will ever fire.
    () => service.getState(),
  );

  const check = useCallback(() => service.check(), [service]);
  const accept = useCallback(
    (options?: { readonly openWindow?: boolean }) => service.accept(options),
    [service],
  );
  const dismiss = useCallback(() => service.dismiss(), [service]);

  return { ...state, check, accept, dismiss };
}
