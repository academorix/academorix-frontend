/**
 * `useHttpManager` React hook.
 *
 * Resolves the `IHttpManager` from the DI container so components
 * can list connections, switch the default at runtime, register
 * custom drivers, etc.
 *
 * @module @stackra/http/react/hooks/use-http-manager
 */

import { useInject } from "@stackra/container/react";
import { HTTP_MANAGER, type IHttpManager } from "@stackra/contracts";

/**
 * Read the active `IHttpManager`.
 *
 * @returns The HTTP manager instance.
 *
 * @example
 * ```tsx
 * function ConnectionList() {
 *   const manager = useHttpManager();
 *   return <ul>{manager.getConnectionNames().map((n) => <li key={n}>{n}</li>)}</ul>;
 * }
 * ```
 */
export function useHttpManager(): IHttpManager {
  return useInject<IHttpManager>(HTTP_MANAGER);
}
