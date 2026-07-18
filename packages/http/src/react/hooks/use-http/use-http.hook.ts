/**
 * `useHttp` React hook.
 *
 * Resolves an `IHttpClient` for a named connection. The client is
 * created lazily, so the hook returns `{ client, ready, error }` —
 * components that need a guaranteed client gate UI on `ready`.
 *
 * @module @stackra/http/react/hooks/use-http
 */

import { useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';
import { HTTP_MANAGER, type IHttpManager } from '@stackra/contracts';

import type { IUseHttpResult } from '@/react/interfaces';

/**
 * Read an `IHttpClient` for the given connection.
 *
 * @param name - Connection name. Uses the default when omitted.
 * @returns `{ client, ready, error }`.
 */
export function useHttp(name?: string): IUseHttpResult {
  const manager = useInject<IHttpManager>(HTTP_MANAGER);
  const [state, setState] = useState<IUseHttpResult>({
    client: null,
    ready: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    manager
      .connection(name)
      .then((client) => {
        if (cancelled) return;
        setState({ client, ready: true, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ client: null, ready: false, error: err as Error });
      });
    return () => {
      cancelled = true;
    };
  }, [manager, name]);

  return state;
}
