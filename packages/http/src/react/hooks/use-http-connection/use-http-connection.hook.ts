/**
 * `useHttpConnection` React hook.
 *
 * Alias for {@link useHttp} kept for parity with the other packages
 * (cache/queue/realtime) that ship a `useXConnection()` hook for
 * advanced use cases. Behaves identically.
 *
 * @module @stackra/http/react/hooks/use-http-connection
 */

import { useHttp } from '../use-http/use-http.hook';
import type { IUseHttpResult } from '@/react/interfaces';

/**
 * Read an `IHttpClient` for the given connection.
 *
 * @param name - Connection name. Uses the default when omitted.
 */
export function useHttpConnection(name?: string): IUseHttpResult {
  return useHttp(name);
}
